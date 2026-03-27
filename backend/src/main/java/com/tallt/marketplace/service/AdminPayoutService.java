package com.tallt.marketplace.service;

import com.tallt.marketplace.dto.wallet.AdminPayoutResponse;
import com.tallt.marketplace.entity.*;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.repository.*;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminPayoutService {

    private final VendorPayoutRepository vendorPayoutRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final CommissionService commissionService;
    private final UserRepository userRepository;
    private final VNPayService vnPayService;

    // ==================== GET PAYOUTS ====================

    public Page<AdminPayoutResponse> getAllPayouts(Pageable pageable) {
        return vendorPayoutRepository.findAll(pageable).map(this::toResponse);
    }

    public Page<AdminPayoutResponse> getPendingPayouts(Pageable pageable) {
        return vendorPayoutRepository.findByStatus("PENDING", pageable)
                .map(this::toResponse);
    }

    private AdminPayoutResponse toResponse(VendorPayout p) {

        AdminPayoutResponse res = new AdminPayoutResponse();
        res.setPayoutId(p.getPayoutID());
        res.setVendorId(p.getVendor().getVendorID());
        res.setVendorName(p.getVendor().getUser().getFullName());
        res.setAmount(p.getAmount());
        res.setStatus(p.getStatus());
        res.setPayoutDate(p.getPayoutDate());
        res.setProcessedAt(p.getProcessedAt());
        res.setAdminNote(p.getAdminNote());

        // Dùng snapshot nếu có
        if (p.getPlatformFee() != null) {
            res.setPlatformCommission(p.getPlatformFee());
            res.setTax(p.getTax());
            res.setVendorReceive(p.getNetAmount());
            return res;
        }

        // Fallback tính lại nếu chưa có snapshot
        BigDecimal percent = commissionService.getCurrentCommission();

        BigDecimal fee = p.getAmount()
                .multiply(percent)
                .divide(BigDecimal.valueOf(100));

        BigDecimal tax = p.getAmount()
                .multiply(BigDecimal.valueOf(5))
                .divide(BigDecimal.valueOf(100));

        BigDecimal net = p.getAmount().subtract(fee).subtract(tax);

        res.setPlatformCommission(fee);
        res.setTax(tax);
        res.setVendorReceive(net);

        return res;
    }

    // ==================== APPROVE PAYOUT (DIRECT - không qua VNPay) ====================

    /**
     * Admin bấm "Approve" trực tiếp → trừ Admin Wallet, cộng Vendor Wallet ngay.
     * Không qua VNPay (việc chuyển khoản thật là ngoài hệ thống).
     */
    @Transactional
    public void approvePayout(Integer payoutId) {

        VendorPayout payout = vendorPayoutRepository.findById(payoutId)
                .orElseThrow(() -> new AppException("Payout không tồn tại"));

        if (!"PENDING".equals(payout.getStatus())) {
            throw new AppException("Payout đã được xử lý");
        }

        BigDecimal netAmount = payout.getNetAmount();

        // Validate admin wallet đủ tiền
        User admin = userRepository.findFirstByRole_RoleName("Admin");
        if (admin == null)
            throw new AppException("Không tìm thấy Admin");

        Wallet adminWallet = walletRepository
                .findByUser_UserID(admin.getUserID())
                .orElseThrow(() -> new AppException("Admin wallet không tồn tại"));

        if (adminWallet.getBalance().compareTo(netAmount) < 0) {
            throw new AppException("Admin không đủ tiền");
        }

        // Trừ tiền admin
        adminWallet.setBalance(adminWallet.getBalance().subtract(netAmount));
        adminWallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(adminWallet);

        WalletTransaction adminTx = new WalletTransaction();
        adminTx.setWallet(adminWallet);
        adminTx.setAmount(netAmount.negate());
        adminTx.setType(WalletTransaction.TransactionType.WITHDRAWAL);
        adminTx.setReferenceID(payout.getPayoutID());
        adminTx.setDescription("Payout #" + payout.getPayoutID()
                + " cho " + payout.getVendor().getUser().getFullName());
        adminTx.setCreatedAt(LocalDateTime.now());
        walletTransactionRepository.save(adminTx);

        // Cộng tiền vendor
        Vendor vendor = payout.getVendor();
        Wallet vendorWallet = walletRepository
                .findByUser_UserID(vendor.getUser().getUserID())
                .orElseThrow(() -> new AppException("Vendor wallet không tồn tại"));

        vendorWallet.setBalance(vendorWallet.getBalance().add(netAmount));
        vendorWallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(vendorWallet);

        WalletTransaction vendorTx = new WalletTransaction();
        vendorTx.setWallet(vendorWallet);
        vendorTx.setAmount(netAmount);
        vendorTx.setType(WalletTransaction.TransactionType.DEPOSIT);
        vendorTx.setReferenceID(payout.getPayoutID());
        vendorTx.setDescription("Nhận tiền Payout #" + payout.getPayoutID());
        vendorTx.setCreatedAt(LocalDateTime.now());
        walletTransactionRepository.save(vendorTx);

        // Cập nhật payout status
        payout.setStatus("COMPLETED");
        payout.setProcessedAt(LocalDateTime.now());
        vendorPayoutRepository.save(payout);
    }

    // ==================== APPROVE PAYOUT VIA VNPAY ====================

    /**
     * Bước 1: Admin click "Approve via VNPay".
     * Validate đủ điều kiện, đánh dấu PROCESSING, trả về VNPay payment URL.
     * Wallet CHƯA bị thay đổi ở bước này.
     *
     * @param payoutId  ID của payout cần duyệt
     * @param ipAddress IP của Admin (lấy từ request)
     * @return VNPay payment URL để redirect browser Admin
     */
    @Transactional
    public String initiateVNPayPayout(Integer payoutId, String ipAddress) {

        VendorPayout payout = vendorPayoutRepository.findById(payoutId)
                .orElseThrow(() -> new AppException("Payout không tồn tại"));

        if (!"PENDING".equals(payout.getStatus())) {
            throw new AppException("Payout đã được xử lý hoặc đang chờ thanh toán VNPay");
        }

        BigDecimal netAmount = payout.getNetAmount();
        if (netAmount == null || netAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException("Số tiền payout không hợp lệ");
        }

        // Validate admin wallet đủ tiền trước khi redirect sang VNPay
        User admin = userRepository.findFirstByRole_RoleName("Admin");
        if (admin == null)
            throw new AppException("Không tìm thấy Admin");

        Wallet adminWallet = walletRepository
                .findByUser_UserID(admin.getUserID())
                .orElseThrow(() -> new AppException("Admin wallet không tồn tại"));

        if (adminWallet.getBalance().compareTo(netAmount) < 0) {
            throw new AppException("Admin không đủ tiền trong ví (cần: "
                    + netAmount + ", hiện có: " + adminWallet.getBalance() + ")");
        }

        // Đánh dấu PROCESSING để tránh Admin click approve thêm lần nữa trong lúc chờ
        payout.setStatus("PROCESSING");
        vendorPayoutRepository.save(payout);

        // Tạo VNPay payment URL
        return vnPayService.createPayoutPaymentUrl(payout, ipAddress);
    }

    /**
     * Bước 2: VNPay callback sau khi Admin hoàn tất thanh toán.
     * Xác minh chữ ký, trừ Admin wallet, cộng Vendor wallet, cập nhật payout status.
     *
     * @param params Query params VNPay gửi về (vnp_ResponseCode, vnp_TxnRef, ...)
     * @return true nếu thanh toán thành công và DB đã được cập nhật
     */
    @Transactional
    public boolean processVNPayPayoutReturn(Map<String, String> params) {

        // Xác minh chữ ký HMAC-SHA512
        if (!vnPayService.validateCallback(params)) {
            return false;
        }

        String responseCode = params.get("vnp_ResponseCode");
        String txnRef = params.get("vnp_TxnRef"); // format: "PAYOUT_{id}"

        if (txnRef == null || !txnRef.startsWith("PAYOUT_")) {
            return false;
        }

        Integer payoutId;
        try {
            payoutId = Integer.parseInt(txnRef.replace("PAYOUT_", ""));
        } catch (NumberFormatException e) {
            return false;
        }

        VendorPayout payout = vendorPayoutRepository.findById(payoutId).orElse(null);
        if (payout == null) return false;

        // Idempotent: nếu đã COMPLETED rồi thì bỏ qua (tránh VNPay retry làm trùng)
        if ("COMPLETED".equals(payout.getStatus())) {
            return true;
        }

        // Thanh toán thất bại (Admin huỷ, hết hạn, lỗi ngân hàng)
        // → reset về PENDING để Admin có thể thử lại
        if (!"00".equals(responseCode)) {
            payout.setStatus("PENDING");
            payout.setAdminNote("VNPay thất bại - ResponseCode: " + responseCode
                    + " - " + LocalDateTime.now());
            vendorPayoutRepository.save(payout);
            return false;
        }

        BigDecimal netAmount = payout.getNetAmount();

        // Trừ Admin wallet
        User admin = userRepository.findFirstByRole_RoleName("Admin");
        if (admin == null) throw new AppException("Không tìm thấy Admin");

        Wallet adminWallet = walletRepository
                .findByUser_UserID(admin.getUserID())
                .orElseThrow(() -> new AppException("Admin wallet không tồn tại"));

        if (adminWallet.getBalance().compareTo(netAmount) < 0) {
            // Trường hợp hiếm: balance thay đổi giữa initiate và callback
            payout.setStatus("PENDING");
            payout.setAdminNote("Admin wallet không đủ tiền tại thời điểm callback");
            vendorPayoutRepository.save(payout);
            throw new AppException("Admin không đủ tiền tại thời điểm xử lý callback");
        }

        adminWallet.setBalance(adminWallet.getBalance().subtract(netAmount));
        adminWallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(adminWallet);

        WalletTransaction adminTx = new WalletTransaction();
        adminTx.setWallet(adminWallet);
        adminTx.setAmount(netAmount.negate());
        adminTx.setType(WalletTransaction.TransactionType.WITHDRAWAL);
        adminTx.setReferenceID(payout.getPayoutID());
        adminTx.setDescription("VNPay Payout #" + payout.getPayoutID()
                + " cho " + payout.getVendor().getUser().getFullName()
                + " - TxnNo: " + params.getOrDefault("vnp_TransactionNo", "N/A"));
        adminTx.setCreatedAt(LocalDateTime.now());
        walletTransactionRepository.save(adminTx);

        // Cộng Vendor wallet
        Wallet vendorWallet = walletRepository
                .findByUser_UserID(payout.getVendor().getUser().getUserID())
                .orElseThrow(() -> new AppException("Vendor wallet không tồn tại"));

        vendorWallet.setBalance(vendorWallet.getBalance().add(netAmount));
        vendorWallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(vendorWallet);

        WalletTransaction vendorTx = new WalletTransaction();
        vendorTx.setWallet(vendorWallet);
        vendorTx.setAmount(netAmount);
        vendorTx.setType(WalletTransaction.TransactionType.DEPOSIT);
        vendorTx.setReferenceID(payout.getPayoutID());
        vendorTx.setDescription("Nhận tiền Payout #" + payout.getPayoutID()
                + " qua VNPay - TxnNo: " + params.getOrDefault("vnp_TransactionNo", "N/A"));
        vendorTx.setCreatedAt(LocalDateTime.now());
        walletTransactionRepository.save(vendorTx);

        // Cập nhật payout → COMPLETED
        payout.setStatus("COMPLETED");
        payout.setProcessedAt(LocalDateTime.now());
        payout.setAdminNote("Thanh toán qua VNPay thành công - TxnNo: "
                + params.getOrDefault("vnp_TransactionNo", "N/A"));
        vendorPayoutRepository.save(payout);

        return true;
    }

    // ==================== REJECT ====================

    @Transactional
    public void rejectPayout(Integer payoutId) {

        VendorPayout payout = vendorPayoutRepository.findById(payoutId)
                .orElseThrow(() -> new AppException("Payout không tồn tại"));

        if (!"PENDING".equals(payout.getStatus())) {
            throw new AppException("Payout đã xử lý");
        }

        payout.setStatus("REJECTED");
        payout.setProcessedAt(LocalDateTime.now());

        vendorPayoutRepository.save(payout);
    }
}