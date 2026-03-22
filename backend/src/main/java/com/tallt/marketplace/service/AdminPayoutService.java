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

        Page<VendorPayout> payouts = vendorPayoutRepository.findAll(pageable);

        return payouts.map(p -> toResponse(p));
    }


    public Page<AdminPayoutResponse> getPendingPayouts(Pageable pageable) {

        Page<VendorPayout> payouts = vendorPayoutRepository.findByStatus("PENDING", pageable);

        return payouts.map(p -> toResponse(p));
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

        if (p.getPlatformFee() != null) {
            // COMPLETED: dùng giá trị đã lưu
            res.setPlatformCommission(p.getPlatformFee());
            res.setTax(p.getTax());
            res.setVendorReceive(p.getNetAmount());
        } else {
            // PENDING: tính preview
            BigDecimal commissionPercent = commissionService.getCurrentCommission();
            BigDecimal fee = p.getAmount().multiply(commissionPercent).divide(BigDecimal.valueOf(100));
            BigDecimal tax = p.getAmount().multiply(BigDecimal.valueOf(5)).divide(BigDecimal.valueOf(100));
            res.setPlatformCommission(fee);
            res.setTax(tax);
            res.setVendorReceive(p.getAmount().subtract(fee).subtract(tax));
        }
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

        // Tìm Admin wallet theo role (không hardcode UserID)
        User admin = userRepository.findFirstByRole_RoleName("Admin");
        if (admin == null) throw new AppException("Không tìm thấy tài khoản Admin");

        Wallet adminWallet = walletRepository
                .findByUser_UserID(admin.getUserID())
                .orElseThrow(() -> new AppException("Admin wallet không tồn tại"));

        BigDecimal payoutAmount = payout.getAmount();

        // Tính phí nền tảng từ CommissionService (dynamic %)
        BigDecimal commissionPercent = commissionService.getCurrentCommission();
        BigDecimal platformFee = payoutAmount
                .multiply(commissionPercent)
                .divide(BigDecimal.valueOf(100));

        // Thuế 5% cố định
        BigDecimal tax = payoutAmount
                .multiply(BigDecimal.valueOf(5))
                .divide(BigDecimal.valueOf(100));

        // Vendor thực nhận = amount - phí - thuế
        BigDecimal netAmount = payoutAmount.subtract(platformFee).subtract(tax);

        if (adminWallet.getBalance().compareTo(netAmount) < 0) {
            throw new AppException("Admin wallet không đủ số dư. Balance: "
                    + adminWallet.getBalance() + ", cần: " + netAmount);
        }

        // Trừ ví Admin (phần trả cho Vendor)
        adminWallet.setBalance(adminWallet.getBalance().subtract(netAmount));
        adminWallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(adminWallet);

        // Ghi transaction: trừ tiền khỏi ví Admin
        WalletTransaction adminTx = new WalletTransaction();
        adminTx.setWallet(adminWallet);
        adminTx.setAmount(netAmount.negate());
        adminTx.setType(WalletTransaction.TransactionType.WITHDRAWAL);
        adminTx.setDescription("Payout #" + payoutId + " to vendor "
                + vendor.getCompanyName()
                + " (Gross: " + payoutAmount + ", Fee: " + platformFee + ", Tax: " + tax + ")");
        adminTx.setReferenceID(payoutId);
        adminTx.setCreatedAt(LocalDateTime.now());
        walletTransactionRepository.save(adminTx);

        // Ghi transaction: phí nền tảng (Admin giữ lại)
        WalletTransaction feeTx = new WalletTransaction();
        feeTx.setWallet(adminWallet);
        feeTx.setAmount(platformFee);
        feeTx.setType(WalletTransaction.TransactionType.COMMISSION_FEE);
        feeTx.setReferenceID(payoutId);
        feeTx.setDescription("Phí nền tảng " + commissionPercent + "% từ Payout #" + payoutId);
        feeTx.setCreatedAt(LocalDateTime.now());
        walletTransactionRepository.save(feeTx);

        // Cộng tiền thực nhận vào ví Vendor
        Wallet vendorWallet = walletRepository
                .findByUser_UserID(vendor.getUser().getUserID())
                .orElse(null);
        if (vendorWallet != null) {
            vendorWallet.setBalance(vendorWallet.getBalance().add(netAmount));
            vendorWallet.setUpdatedAt(LocalDateTime.now());
            walletRepository.save(vendorWallet);

            WalletTransaction vendorTx = new WalletTransaction();
            vendorTx.setWallet(vendorWallet);
            vendorTx.setAmount(netAmount);
            vendorTx.setType(WalletTransaction.TransactionType.DEPOSIT);
            vendorTx.setReferenceID(payoutId);
            vendorTx.setDescription("Nhận tiền Payout #" + payoutId
                    + " (Gross: " + payoutAmount + ", Phí: " + platformFee + ", Thuế: " + tax + ")");
            vendorTx.setCreatedAt(LocalDateTime.now());
            walletTransactionRepository.save(vendorTx);
        }

        // Lưu chi tiết phí/thuế vào VendorPayout
        payout.setPlatformFee(platformFee);
        payout.setTax(tax);
        payout.setNetAmount(netAmount);
        payout.setStatus("COMPLETED");
        payout.setProcessedAt(LocalDateTime.now());
        vendorPayoutRepository.save(payout);
    }


    /**
     * Từ chối yêu cầu rút tiền.
     * Vì requestPayout KHÔNG trừ ví → chỉ cần đổi status = REJECTED.
     * Amount sẽ được trả lại vào "available" tự động (không còn bị trừ từ pending).
     */
    @Transactional
    public void rejectPayout(Integer payoutId) {

        VendorPayout payout = vendorPayoutRepository.findById(payoutId)
                .orElseThrow(() -> new AppException("Payout không tồn tại"));

        if (!"PENDING".equals(payout.getStatus())) {
            throw new AppException("Payout đã được xử lý");
        }

        payout.setStatus("REJECTED");
        payout.setProcessedAt(LocalDateTime.now());
        vendorPayoutRepository.save(payout);
    }
}