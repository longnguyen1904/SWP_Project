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

        // ✅ LUÔN dùng snapshot nếu có
        if (p.getPlatformFee() != null) {
            res.setPlatformCommission(p.getPlatformFee());
            res.setTax(p.getTax());
            res.setVendorReceive(p.getNetAmount());
            return res;
        }

        // 👉 fallback (hiếm khi xảy ra nếu đã fix requestPayout)
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

    // ==================== PHASE 1: INITIATE APPROVAL ====================

    /**
     * Phase 1: Admin bấm "Approve" → validate + tạo VNPay URL.
     * Chưa chuyển tiền, chỉ đổi status sang APPROVED_PENDING_PAYMENT.
     *
     * @param payoutId  ID payout cần approve
     * @param ipAddress IP của Admin (cho VNPay)
     * @return URL thanh toán VNPay
     */
    @Transactional
    public String initiatePayoutApproval(Integer payoutId, String ipAddress) {

        VendorPayout payout = vendorPayoutRepository.findById(payoutId)
                .orElseThrow(() -> new AppException("Payout không tồn tại"));

        if (!"PENDING".equals(payout.getStatus())) {
            throw new AppException("Payout đã được xử lý");
        }

        // Validate snapshot
        BigDecimal platformFee = payout.getPlatformFee();
        BigDecimal tax = payout.getTax();
        BigDecimal netAmount = payout.getNetAmount();

        if (platformFee == null || tax == null || netAmount == null) {
            throw new AppException("Payout chưa có snapshot commission");
        }

        // Validate admin wallet đủ tiền
        User admin = userRepository.findFirstByRole_RoleName("Admin");
        if (admin == null) throw new AppException("Không tìm thấy Admin");

        Wallet adminWallet = walletRepository
                .findByUser_UserID(admin.getUserID())
                .orElseThrow(() -> new AppException("Admin wallet không tồn tại"));

        if (adminWallet.getBalance().compareTo(netAmount) < 0) {
            throw new AppException("Admin không đủ tiền");
        }

        // Đổi status → chờ thanh toán VNPay
        payout.setStatus("APPROVED_PENDING_PAYMENT");
        vendorPayoutRepository.save(payout);

        // Tạo VNPay URL
        return vnPayService.createPayoutPaymentUrl(payout, ipAddress);
    }

    // ==================== PHASE 2: VNPAY CALLBACK ====================

    /**
     * Phase 2: Xử lý callback từ VNPay sau khi Admin thanh toán payout.
     *
     * @param params query params VNPay gửi về
     * @return true nếu thanh toán thành công
     */
    @Transactional
    public boolean processPayoutVNPayReturn(Map<String, String> params) {

        // Xác minh chữ ký
        if (!vnPayService.validateCallback(params)) {
            return false;
        }

        String responseCode = params.get("vnp_ResponseCode");
        String txnRef = params.get("vnp_TxnRef");

        if (txnRef == null || !txnRef.startsWith("PAYOUT_")) return false;

        // Parse payoutId từ "PAYOUT_123"
        Integer payoutId;
        try {
            payoutId = Integer.parseInt(txnRef.replace("PAYOUT_", ""));
        } catch (NumberFormatException e) {
            return false;
        }

        VendorPayout payout = vendorPayoutRepository.findById(payoutId).orElse(null);
        if (payout == null) return false;

        // Idempotent: nếu đã xử lý rồi thì bỏ qua
        if (!"APPROVED_PENDING_PAYMENT".equals(payout.getStatus())) {
            return "COMPLETED".equals(payout.getStatus());
        }

        if ("00".equals(responseCode)) {
            // ✅ THANH TOÁN THÀNH CÔNG → chuyển tiền
            executePayoutTransfer(payout);

            payout.setStatus("COMPLETED");
            payout.setTransactionRef(params.get("vnp_TransactionNo"));
            payout.setProcessedAt(LocalDateTime.now());
            vendorPayoutRepository.save(payout);

            return true;
        } else {
            // ❌ THẤT BẠI → rollback status về PENDING (admin có thể thử lại)
            payout.setStatus("PENDING");
            payout.setTransactionRef(params.get("vnp_TransactionNo"));
            vendorPayoutRepository.save(payout);

            return false;
        }
    }

    // ==================== REJECT (GIỮ NGUYÊN) ====================

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

    // ==================== PRIVATE: TRANSFER LOGIC ====================

    /**
     * Logic chuyển tiền giữ nguyên từ approvePayout() cũ.
     * Trừ admin wallet, cộng vendor wallet, ghi nhận transactions.
     */
    private void executePayoutTransfer(VendorPayout payout) {

        Vendor vendor = payout.getVendor();
        BigDecimal platformFee = payout.getPlatformFee();
        BigDecimal netAmount = payout.getNetAmount();

        User admin = userRepository.findFirstByRole_RoleName("Admin");
        if (admin == null) throw new AppException("Không tìm thấy Admin");

        Wallet adminWallet = walletRepository
                .findByUser_UserID(admin.getUserID())
                .orElseThrow(() -> new AppException("Admin wallet không tồn tại"));

        // Trừ tiền admin
        adminWallet.setBalance(adminWallet.getBalance().subtract(netAmount));
        adminWallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(adminWallet);

        // Transaction admin
        WalletTransaction adminTx = new WalletTransaction();
        adminTx.setWallet(adminWallet);
        adminTx.setAmount(netAmount.negate());
        adminTx.setType(WalletTransaction.TransactionType.WITHDRAWAL);
        adminTx.setReferenceID(payout.getPayoutID());
        adminTx.setDescription("Payout #" + payout.getPayoutID());
        adminTx.setCreatedAt(LocalDateTime.now());
        walletTransactionRepository.save(adminTx);

        // Fee (admin giữ)
        WalletTransaction feeTx = new WalletTransaction();
        feeTx.setWallet(adminWallet);
        feeTx.setAmount(platformFee);
        feeTx.setType(WalletTransaction.TransactionType.COMMISSION_FEE);
        feeTx.setReferenceID(payout.getPayoutID());
        feeTx.setCreatedAt(LocalDateTime.now());
        walletTransactionRepository.save(feeTx);

        // Cộng tiền vendor
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
        vendorTx.setCreatedAt(LocalDateTime.now());
        walletTransactionRepository.save(vendorTx);
    }
}