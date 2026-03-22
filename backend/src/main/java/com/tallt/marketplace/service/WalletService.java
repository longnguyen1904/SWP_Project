package com.tallt.marketplace.service;

import com.tallt.marketplace.dto.wallet.*;
import com.tallt.marketplace.entity.*;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.repository.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class WalletService {

        @Autowired
        private WalletRepository walletRepository;

        @Autowired
        private WalletTransactionRepository walletTransactionRepository;

        @Autowired
        private VendorRepository vendorRepository;

        @Autowired
        private VendorPayoutRepository vendorPayoutRepository;

        @Autowired
        private OrderRepository orderRepository;

        @Autowired
        private CommissionService commissionService;

        public WalletResponse getVendorWallet(Integer userId) {

                Wallet wallet = walletRepository.findByUser_UserID(userId)
                                .orElseThrow(() -> new AppException("Ví không tồn tại"));

                List<WalletTransactionResponse> transactions = walletTransactionRepository
                                .findByWallet_WalletIDOrderByCreatedAtDesc(wallet.getWalletID())
                                .stream()
                                .map(this::toTransactionResponse)
                                .collect(Collectors.toList());

                WalletResponse res = new WalletResponse();
                res.setBalance(wallet.getBalance());
                res.setTransactions(transactions);
                return res;
        }

        @Transactional
        public Map<String, Object> requestPayout(Integer userId, PayoutRequest request) {

                Vendor vendor = vendorRepository.findByUser_UserID(userId)
                                .orElseThrow(() -> new AppException("Vendor không tồn tại"));

                if (!vendor.getIsVerified()) {
                        throw new AppException("Vendor chưa verify");
                }

                BigDecimal totalRevenue = orderRepository
                                .sumCompletedRevenueByVendorId(vendor.getVendorID());

                BigDecimal totalWithdrawn = vendorPayoutRepository
                                .sumAmountByVendorAndStatus(vendor.getVendorID(), "COMPLETED");

                BigDecimal totalPending = vendorPayoutRepository
                                .sumAmountByVendorAndStatus(vendor.getVendorID(), "PENDING");

                BigDecimal available = totalRevenue
                                .subtract(totalWithdrawn)
                                .subtract(totalPending);

                if (available.compareTo(request.getAmount()) < 0) {
                        throw new AppException("Không đủ tiền rút");
                }

                // SNAPSHOT COMMISSION 
                BigDecimal percent = commissionService.getCurrentCommission();

                BigDecimal fee = request.getAmount()
                                .multiply(percent)
                                .divide(BigDecimal.valueOf(100));

                BigDecimal tax = request.getAmount()
                                .multiply(BigDecimal.valueOf(5))
                                .divide(BigDecimal.valueOf(100));

                BigDecimal net = request.getAmount()
                                .subtract(fee)
                                .subtract(tax);

                VendorPayout payout = new VendorPayout();
                payout.setVendor(vendor);
                payout.setAmount(request.getAmount());
                payout.setPlatformFee(fee);
                payout.setTax(tax); 
                payout.setNetAmount(net); 
                payout.setPayoutDate(LocalDateTime.now());
                payout.setStatus("PENDING");

                vendorPayoutRepository.save(payout);

                return Map.of(
                                "payoutId", payout.getPayoutID(),
                                "amount", payout.getAmount(),
                                "netAmount", net,
                                "status", payout.getStatus(),
                                "availableAfter", available.subtract(request.getAmount()));
        }

        private WalletTransactionResponse toTransactionResponse(WalletTransaction t) {
                WalletTransactionResponse res = new WalletTransactionResponse();
                res.setType(t.getType().name());
                res.setAmount(t.getAmount());
                res.setCreatedAt(t.getCreatedAt());
                res.setDescription(t.getDescription());
                return res;
        }
}