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

@Service
@RequiredArgsConstructor
public class AdminPayoutService {

    private final VendorPayoutRepository vendorPayoutRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final CommissionService commissionService;
    private final UserRepository userRepository;


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