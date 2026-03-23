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

    @Transactional
    public void approvePayout(Integer payoutId) {

        VendorPayout payout = vendorPayoutRepository.findById(payoutId)
                .orElseThrow(() -> new AppException("Payout không tồn tại"));

        if (!"PENDING".equals(payout.getStatus())) {
            throw new AppException("Payout đã được xử lý");
        }

        Vendor vendor = payout.getVendor();

        User admin = userRepository.findFirstByRole_RoleName("Admin");
        if (admin == null)
            throw new AppException("Không tìm thấy Admin");

        Wallet adminWallet = walletRepository
                .findByUser_UserID(admin.getUserID())
                .orElseThrow(() -> new AppException("Admin wallet không tồn tại"));

        BigDecimal payoutAmount = payout.getAmount();

        // ✅ DÙNG SNAPSHOT
        BigDecimal platformFee = payout.getPlatformFee();
        BigDecimal tax = payout.getTax();
        BigDecimal netAmount = payout.getNetAmount();

        if (platformFee == null || tax == null || netAmount == null) {
            throw new AppException("Payout chưa có snapshot commission");
        }

        if (adminWallet.getBalance().compareTo(netAmount) < 0) {
            throw new AppException("Admin không đủ tiền");
        }

        // Trừ tiền admin
        adminWallet.setBalance(adminWallet.getBalance().subtract(netAmount));
        adminWallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(adminWallet);

        // Transaction admin
        WalletTransaction adminTx = new WalletTransaction();
        adminTx.setWallet(adminWallet);
        adminTx.setAmount(netAmount.negate());
        adminTx.setType(WalletTransaction.TransactionType.WITHDRAWAL);
        adminTx.setReferenceID(payoutId);
        adminTx.setDescription("Payout #" + payoutId);
        adminTx.setCreatedAt(LocalDateTime.now());
        walletTransactionRepository.save(adminTx);

        // Fee (admin giữ)
        WalletTransaction feeTx = new WalletTransaction();
        feeTx.setWallet(adminWallet);
        feeTx.setAmount(platformFee);
        feeTx.setType(WalletTransaction.TransactionType.COMMISSION_FEE);
        feeTx.setReferenceID(payoutId);
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
        vendorTx.setReferenceID(payoutId);
        vendorTx.setCreatedAt(LocalDateTime.now());
        walletTransactionRepository.save(vendorTx);

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