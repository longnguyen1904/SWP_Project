package com.tallt.marketplace.service;

import com.tallt.marketplace.config.VNPayConfig;
import com.tallt.marketplace.dto.checkout.CheckoutRequest;
import com.tallt.marketplace.dto.checkout.CheckoutResponse;
import com.tallt.marketplace.dto.checkout.PaymentConfirmRequest;
import com.tallt.marketplace.dto.checkout.PaymentConfirmResponse;
import com.tallt.marketplace.entity.License;
import com.tallt.marketplace.entity.LicenseTier;
import com.tallt.marketplace.entity.Order;
import com.tallt.marketplace.entity.Product;
import com.tallt.marketplace.entity.User;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.repository.LicenseRepository;
import com.tallt.marketplace.repository.LicenseTierRepository;
import com.tallt.marketplace.repository.OrderRepository;
import com.tallt.marketplace.repository.ProductRepository;
import com.tallt.marketplace.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.SortedMap;
import java.util.TreeMap;
import java.util.UUID;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

@Service
public class CheckoutService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private LicenseRepository licenseRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private LicenseTierRepository licenseTierRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VNPayConfig vnPayConfig;

    @Transactional
    public CheckoutResponse createCheckout(Integer userId, CheckoutRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User không tồn tại"));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new AppException("Sản phẩm không tồn tại"));

        if (product.getStatus() != Product.ProductStatus.APPROVED) {
            throw new AppException("Sản phẩm chưa được duyệt");
        }

        LicenseTier tier = licenseTierRepository.findById(request.getTierId())
                .orElseThrow(() -> new AppException("License Tier không tồn tại"));

        if (!tier.getProduct().getProductID().equals(product.getProductID())) {
            throw new AppException("License Tier không thuộc sản phẩm này");
        }

        int qty = request.getQuantity() != null ? request.getQuantity() : 1;
        BigDecimal unitPrice = tier.getPrice() != null ? tier.getPrice() : product.getBasePrice();
        if (unitPrice == null) {
            throw new AppException("Không xác định được giá sản phẩm");
        }

        BigDecimal discount = BigDecimal.ZERO;
        BigDecimal total = unitPrice.multiply(BigDecimal.valueOf(qty)).subtract(discount);

        String txRef = "VNPAY-DEMO-" + UUID.randomUUID();

        Order order = new Order();
        order.setUser(user);
        order.setProduct(product);
        order.setTier(tier);
        order.setQuantity(qty);
        order.setUnitPrice(unitPrice);
        order.setDiscountAmount(discount);
        order.setTotalAmount(total);
        order.setPaymentMethod("VNPay");
        order.setPaymentStatus("Pending");
        order.setTransactionRef(txRef);
        orderRepository.save(order);

        CheckoutResponse response = new CheckoutResponse();
        response.setOrderId(order.getOrderID());
        response.setPaymentMethod(order.getPaymentMethod());
        response.setPaymentStatus(order.getPaymentStatus());
        response.setTransactionRef(order.getTransactionRef());
        response.setTotalAmount(order.getTotalAmount());
        response.setPaymentUrl(buildVNPayPaymentUrl(order));
        return response;
    }

    private String buildVNPayPaymentUrl(Order order) {
        // Nếu chưa cấu hình thì fallback demo url cũ
        if (vnPayConfig.getTmnCode() == null || vnPayConfig.getTmnCode().isBlank()
                || vnPayConfig.getHashSecret() == null || vnPayConfig.getHashSecret().isBlank()) {
            return "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?demo=1&orderId=" + order.getOrderID()
                    + "&txRef=" + order.getTransactionRef();
        }

        String vnp_Version = "2.1.0";
        String vnp_Command = "pay";
        String vnp_TmnCode = vnPayConfig.getTmnCode();
        String vnp_TxnRef = order.getTransactionRef();
        String vnp_OrderInfo = "Thanh toan don hang #" + order.getOrderID();
        String vnp_OrderType = "other";
        String vnp_Amount = order.getTotalAmount().multiply(BigDecimal.valueOf(100)).toBigInteger().toString();
        String vnp_Locale = "vn";
        String vnp_CurrCode = "VND";
        String vnp_ReturnUrl = vnPayConfig.getReturnUrl();
        String vnp_IpAddr = "127.0.0.1";
        String vnp_CreateDate = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        SortedMap<String, String> params = new TreeMap<>();
        params.put("vnp_Version", vnp_Version);
        params.put("vnp_Command", vnp_Command);
        params.put("vnp_TmnCode", vnp_TmnCode);
        params.put("vnp_Amount", vnp_Amount);
        params.put("vnp_CurrCode", vnp_CurrCode);
        params.put("vnp_TxnRef", vnp_TxnRef);
        params.put("vnp_OrderInfo", vnp_OrderInfo);
        params.put("vnp_OrderType", vnp_OrderType);
        params.put("vnp_Locale", vnp_Locale);
        params.put("vnp_ReturnUrl", vnp_ReturnUrl);
        params.put("vnp_IpAddr", vnp_IpAddr);
        params.put("vnp_CreateDate", vnp_CreateDate);

        String hashData = buildQuery(params, false);
        String secureHash = hmacSHA512(vnPayConfig.getHashSecret(), hashData);

        String query = buildQuery(params, true) + "&vnp_SecureHash=" + urlEncode(secureHash);
        String baseUrl = (vnPayConfig.getPayUrl() != null && !vnPayConfig.getPayUrl().isBlank())
                ? vnPayConfig.getPayUrl()
                : "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
        return baseUrl + "?" + query;
    }

    private String buildQuery(SortedMap<String, String> params, boolean encode) {
        StringBuilder sb = new StringBuilder();
        boolean first = true;
        for (Map.Entry<String, String> e : params.entrySet()) {
            if (e.getValue() == null) {
                continue;
            }
            if (!first) {
                sb.append("&");
            }
            first = false;
            sb.append(e.getKey());
            sb.append("=");
            sb.append(encode ? urlEncode(e.getValue()) : e.getValue());
        }
        return sb.toString();
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String hmacSHA512(String key, String data) {
        try {
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac512.init(secretKey);
            byte[] bytes = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new AppException("Không thể tạo checksum VNPay");
        }
    }

    @Transactional
    public PaymentConfirmResponse confirmPayment(Integer userId, PaymentConfirmRequest request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new AppException("Order không tồn tại"));

        if (!order.getUser().getUserID().equals(userId)) {
            throw new AppException("Bạn không có quyền thao tác trên order này");
        }

        if (!order.getTransactionRef().equals(request.getTransactionRef())) {
            throw new AppException("TransactionRef không khớp");
        }

        if (!"Paid".equalsIgnoreCase(request.getStatus())) {
            order.setPaymentStatus("Failed");
            orderRepository.save(order);
            PaymentConfirmResponse resp = new PaymentConfirmResponse();
            resp.setOrderId(order.getOrderID());
            resp.setPaymentStatus(order.getPaymentStatus());
            return resp;
        }

        if ("Paid".equalsIgnoreCase(order.getPaymentStatus())) {
            License existing = licenseRepository.findByOrder_OrderID(order.getOrderID())
                    .orElseThrow(() -> new AppException("License không tồn tại"));
            PaymentConfirmResponse resp = new PaymentConfirmResponse();
            resp.setOrderId(order.getOrderID());
            resp.setPaymentStatus(order.getPaymentStatus());
            resp.setLicenseId(existing.getLicenseID());
            resp.setLicenseKey(existing.getLicenseKey());
            resp.setExpireAt(existing.getExpireAt());
            return resp;
        }

        order.setPaymentStatus("Paid");
        orderRepository.save(order);

        License license = new License();
        license.setOrder(order);
        license.setUser(order.getUser());
        license.setProduct(order.getProduct());
        license.setTier(order.getTier());
        license.setIsActive(true);
        license.setIsTrial(false);

        Integer durationDays = order.getTier().getDurationDays();
        if (durationDays != null && durationDays > 0) {
            license.setExpireAt(LocalDateTime.now().plusDays(durationDays));
        }

        license.setLicenseKey(generateLicenseKey());
        while (licenseRepository.existsByLicenseKey(license.getLicenseKey())) {
            license.setLicenseKey(generateLicenseKey());
        }

        licenseRepository.save(license);

        PaymentConfirmResponse resp = new PaymentConfirmResponse();
        resp.setOrderId(order.getOrderID());
        resp.setPaymentStatus(order.getPaymentStatus());
        resp.setLicenseId(license.getLicenseID());
        resp.setLicenseKey(license.getLicenseKey());
        resp.setExpireAt(license.getExpireAt());
        return resp;
    }

    private String generateLicenseKey() {
        return "LIC-" + UUID.randomUUID();
    }
}
