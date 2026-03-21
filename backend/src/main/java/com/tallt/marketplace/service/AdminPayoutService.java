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


    public Page<AdminPayoutResponse> getAllPayouts(Pageable pageable) {

        Page<VendorPayout> payouts = vendorPayoutRepository.findAll(pageable);

        return payouts.map(p -> {

            AdminPayoutResponse res = new AdminPayoutResponse();

            res.setPayoutId(p.getPayoutID());
            res.setVendorId(p.getVendor().getVendorID());
            res.setVendorName(p.getVendor().getUser().getFullName());

            BigDecimal amount = p.getAmount();

            BigDecimal commissionPercent = commissionService.getCurrentCommission();

            BigDecimal commissionAmount = amount
                    .multiply(commissionPercent)
                    .divide(BigDecimal.valueOf(100));

            BigDecimal vendorReceive = amount.subtract(commissionAmount);

            res.setAmount(amount);
            res.setPlatformCommission(commissionAmount);
            res.setVendorReceive(vendorReceive);

            res.setStatus(p.getStatus());
            res.setPayoutDate(p.getPayoutDate());

            return res;
        });
    }


    public Page<AdminPayoutResponse> getPendingPayouts(Pageable pageable) {

        Page<VendorPayout> payouts = vendorPayoutRepository.findByStatus("PENDING", pageable);

        return payouts.map(p -> {

            AdminPayoutResponse res = new AdminPayoutResponse();

            res.setPayoutId(p.getPayoutID());
            res.setVendorId(p.getVendor().getVendorID());
            res.setVendorName(p.getVendor().getUser().getFullName());
            res.setAmount(p.getAmount());
            res.setStatus(p.getStatus());
            res.setPayoutDate(p.getPayoutDate());
            res.setPlatformCommission(p.getAmount()
                    .multiply(commissionService.getCurrentCommission())
                    .divide(BigDecimal.valueOf(100)));
            res.setVendorReceive(p.getAmount().subtract(res.getPlatformCommission()));

            return res;
        });
    }


    @Transactional
    public void approvePayout(Integer payoutId) {

        VendorPayout payout = vendorPayoutRepository.findById(payoutId)
                .orElseThrow(() -> new AppException("Payout không tồn tại"));

        if (!"PENDING".equals(payout.getStatus())) {
            throw new AppException("Payout đã được xử lý");
        }

        Vendor vendor = payout.getVendor();

        Wallet vendorWallet = walletRepository
                .findByUser_UserID(vendor.getUser().getUserID())
                .orElseThrow(() -> new AppException("Vendor wallet không tồn tại"));


        Wallet adminWallet = walletRepository
                .findByUser_UserID(1)
                .orElseThrow(() -> new AppException("Admin wallet không tồn tại"));

        BigDecimal payoutAmount = payout.getAmount();


        BigDecimal commissionPercent = commissionService.getCurrentCommission();


        BigDecimal commissionAmount = payoutAmount
                .multiply(commissionPercent)
                .divide(BigDecimal.valueOf(100));


        BigDecimal vendorReceive = payoutAmount.subtract(commissionAmount);


        if (adminWallet.getBalance().compareTo(vendorReceive) < 0) {
            throw new AppException("Admin wallet does not have enough balance for this payout");
        }



        adminWallet.setBalance(adminWallet.getBalance().subtract(vendorReceive));
        adminWallet.setUpdatedAt(LocalDateTime.now());

        vendorWallet.setBalance(vendorWallet.getBalance().add(vendorReceive));
        vendorWallet.setUpdatedAt(LocalDateTime.now());

        walletRepository.save(adminWallet);
        walletRepository.save(vendorWallet);


        WalletTransaction adminTransaction = new WalletTransaction();

        adminTransaction.setWallet(adminWallet);
        adminTransaction.setAmount(vendorReceive);
        adminTransaction.setType(WalletTransaction.TransactionType.WITHDRAWAL);
        adminTransaction.setDescription("Payout to vendor #" + vendor.getVendorID());
        adminTransaction.setReferenceID(payoutId);
        adminTransaction.setCreatedAt(LocalDateTime.now());

        walletTransactionRepository.save(adminTransaction);


        WalletTransaction vendorTransaction = new WalletTransaction();

        vendorTransaction.setWallet(vendorWallet);
        vendorTransaction.setAmount(vendorReceive);
        vendorTransaction.setType(WalletTransaction.TransactionType.DEPOSIT);
        vendorTransaction.setDescription("Payout received #" + payoutId);
        vendorTransaction.setReferenceID(payoutId);
        vendorTransaction.setCreatedAt(LocalDateTime.now());

        walletTransactionRepository.save(vendorTransaction);


        payout.setStatus("COMPLETED");
        payout.setPayoutDate(LocalDateTime.now());

        vendorPayoutRepository.save(payout);
    }


    @Transactional
    public void rejectPayout(Integer payoutId) {

        VendorPayout payout = vendorPayoutRepository.findById(payoutId)
                .orElseThrow(() -> new AppException("Payout không tồn tại"));

        if (!"PENDING".equals(payout.getStatus())) {
            throw new AppException("Payout đã được xử lý");
        }

        payout.setStatus("REJECTED");

        vendorPayoutRepository.save(payout);
    }
}