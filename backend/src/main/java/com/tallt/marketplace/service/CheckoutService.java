package com.tallt.marketplace.service;

import com.tallt.marketplace.dto.checkout.CheckoutRequest;
import com.tallt.marketplace.dto.checkout.CheckoutResponse;
import com.tallt.marketplace.entity.*;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Service xử lý nghiệp vụ Checkout:
 * - Tạo đơn hàng (Order)
 * - Gọi VNPayService để tạo URL thanh toán
 * - Xử lý callback sau khi VNPay trả kết quả
 *
 * Trách nhiệm: orchestrate luồng checkout, KHÔNG trực tiếp xử lý VNPay.
 */
@Service
public class CheckoutService {

    // Constants tránh magic strings
    private static final String STATUS_PENDING = "Pending";
    private static final String STATUS_COMPLETED = "COMPLETED";
    private static final String STATUS_FAILED = "FAILED";

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final LicenseTierRepository licenseTierRepository;
    private final UserRepository userRepository;
    private final LicenseRepository licenseRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final VNPayService vnPayService;

    public CheckoutService(
            OrderRepository orderRepository,
            ProductRepository productRepository,
            LicenseTierRepository licenseTierRepository,
            UserRepository userRepository,
            LicenseRepository licenseRepository,
            WalletRepository walletRepository,
            WalletTransactionRepository walletTransactionRepository,
            VNPayService vnPayService) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.licenseTierRepository = licenseTierRepository;
        this.userRepository = userRepository;
        this.licenseRepository = licenseRepository;
        this.walletRepository = walletRepository;
        this.walletTransactionRepository = walletTransactionRepository;
        this.vnPayService = vnPayService;
    }

    /**
     * Bước 1+2: Tạo Order (Pending) + sinh URL thanh toán VNPay.
     *
     * @param userId    ID người mua (từ header X-User-Id)
     * @param request   { productId, tierId }
     * @param ipAddress IP client
     * @return { orderId, paymentUrl }
     */
    @Transactional
    public CheckoutResponse createCheckout(Integer userId, CheckoutRequest request, String ipAddress) {
        // Validate product
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new AppException("Sản phẩm không tồn tại"));

        if (!product.getIsApproved()) {
            throw new AppException("Sản phẩm chưa được duyệt, không thể mua");
        }

        // Validate tier thuộc product
        LicenseTier tier = licenseTierRepository.findById(request.getTierId())
                .orElseThrow(() -> new AppException("Gói license không tồn tại"));

        if (!tier.getProduct().getProductID().equals(product.getProductID())) {
            throw new AppException("Gói license không thuộc sản phẩm này");
        }

        // Validate user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("Người dùng không tồn tại"));

        // Kiểm tra License còn hiệu lực (check bảng Licenses, KHÔNG check Orders)
        String warning = null;
        boolean hasActiveLicense = licenseRepository
                .existsByUser_UserIDAndProduct_ProductIDAndIsActiveTrueAndExpireAtAfter(
                        userId, product.getProductID(), LocalDateTime.now());
        if (hasActiveLicense) {
            warning = "Bạn đang có bản quyền còn hạn sử dụng cho phần mềm này. "
                    + "Giao dịch mới sẽ cung cấp thêm mã bản quyền hoặc cộng dồn thời gian sử dụng.";
        }

        // Tạo Order (1 Order = 1 Product)
        Order order = new Order();
        order.setUser(user);
        order.setProduct(product);
        order.setTier(tier);
        order.setQuantity(1);
        order.setUnitPrice(tier.getPrice());
        order.setDiscountAmount(BigDecimal.ZERO);
        order.setTotalAmount(tier.getPrice());
        order.setPaymentMethod("VNPay");
        order.setPaymentStatus(STATUS_PENDING);
        order.setCreatedAt(LocalDateTime.now());

        orderRepository.save(order);

        // Tạo URL thanh toán VNPay
        String paymentUrl = vnPayService.createPaymentUrl(order, ipAddress);

        return new CheckoutResponse(order.getOrderID(), paymentUrl, warning);
    }

    /**
     * Bước 3: Xử lý callback từ VNPay sau khi khách thanh toán.
     *
     * @param params query params VNPay gửi về (vnp_ResponseCode, vnp_TxnRef, ...)
     * @return true nếu thanh toán thành công
     */
    @Transactional
    public boolean processVNPayReturn(Map<String, String> params) {
        // Xác minh chữ ký
        if (!vnPayService.validateCallback(params)) {
            return false;
        }

        String responseCode = params.get("vnp_ResponseCode");
        String txnRef = params.get("vnp_TxnRef");

        if (txnRef == null) return false;

        // Tìm Order (bảo vệ khỏi NumberFormatException)
        Order order;
        try {
            order = orderRepository.findById(Integer.parseInt(txnRef)).orElse(null);
        } catch (NumberFormatException e) {
            return false;
        }
        if (order == null) return false;

        // Nếu đã xử lý rồi thì bỏ qua (idempotent)
        if (!STATUS_PENDING.equalsIgnoreCase(order.getPaymentStatus())) {
            return STATUS_COMPLETED.equalsIgnoreCase(order.getPaymentStatus());
        }

        // Kiểm tra VNPay response: "00" = thành công
        if ("00".equals(responseCode)) {
            order.setPaymentStatus(STATUS_COMPLETED);
            order.setTransactionRef(params.get("vnp_TransactionNo"));
            orderRepository.save(order);

            createLicense(order);
            creditAdminWallet(order);

            return true;
        } else {
            order.setPaymentStatus(STATUS_FAILED);
            order.setTransactionRef(params.get("vnp_TransactionNo"));
            orderRepository.save(order);
            return false;
        }
    }

    /**
     * Lấy productId từ orderId (dùng để redirect về trang sản phẩm khi thanh toán thất bại).
     */
    public Integer getProductIdByOrderId(String orderIdStr) {
        try {
            Order order = orderRepository.findById(Integer.parseInt(orderIdStr)).orElse(null);
            return order != null && order.getProduct() != null
                    ? order.getProduct().getProductID() : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    // ==================== PRIVATE METHODS ====================

    /**
     * Tạo License cho Customer sau thanh toán thành công.
     */
    private void createLicense(Order order) {
        License license = new License();
        license.setLicenseKey(UUID.randomUUID().toString().toUpperCase());
        license.setOrder(order);
        license.setUser(order.getUser());
        license.setProduct(order.getProduct());
        license.setTier(order.getTier());
        license.setIsActive(true);
        license.setIsTrial(false);
        license.setCreatedAt(LocalDateTime.now());

        // Tính ngày hết hạn = now + durationDays
        int durationDays = order.getTier().getDurationDays() != null
                ? order.getTier().getDurationDays() : 365;
        license.setExpireAt(LocalDateTime.now().plusDays(durationDays));

        licenseRepository.save(license);
    }

    /**
     * Cộng tiền bán hàng vào Wallet của Admin (platform thu tiền trước).
     * Việc tính phí sàn, thuế và chuyển tiền cho Vendor sẽ được xử lý riêng.
     */
    private void creditAdminWallet(Order order) {
        // Tìm user Admin theo role
        User admin = userRepository.findFirstByRole_RoleName("Admin");
        if (admin == null) return;

        Wallet wallet = walletRepository.findByUser_UserID(admin.getUserID()).orElse(null);
        if (wallet == null) return;

        // Cộng toàn bộ số tiền đơn hàng vào ví Admin
        wallet.setBalance(wallet.getBalance().add(order.getTotalAmount()));
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);

        // Ghi nhận transaction
        WalletTransaction tx = new WalletTransaction();
        tx.setWallet(wallet);
        tx.setAmount(order.getTotalAmount());
        tx.setType(WalletTransaction.TransactionType.SALE_REVENUE);
        tx.setReferenceID(order.getOrderID());
        tx.setDescription("Payment received for Order #" + order.getOrderID()
                + " (Product: " + order.getProduct().getProductName() + ")");
        tx.setCreatedAt(LocalDateTime.now());
        walletTransactionRepository.save(tx);
    }
}
