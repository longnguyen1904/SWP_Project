package com.tallt.marketplace.service;

import com.tallt.marketplace.dto.wallet.*;
import com.tallt.marketplace.entity.*;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
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

        // GET WALLET
        public WalletResponse getVendorWallet(Integer userId, int page, int size) {

                Wallet wallet = walletRepository.findByUser_UserID(userId)
                                .orElseThrow(() -> new AppException("Ví không tồn tại"));

                Vendor vendor = vendorRepository.findByUser_UserID(userId)
                                .orElseThrow(() -> new AppException("Vendor không tồn tại"));

                BigDecimal totalRevenue = Optional.ofNullable(
                                orderRepository.sumCompletedRevenueByVendorId(vendor.getVendorID()))
                                .orElse(BigDecimal.ZERO);

                BigDecimal totalWithdrawn = Optional.ofNullable(
                                vendorPayoutRepository.sumAmountByVendorAndStatus(vendor.getVendorID(), "COMPLETED"))
                                .orElse(BigDecimal.ZERO);

                BigDecimal totalPending = Optional.ofNullable(
                                vendorPayoutRepository.sumAmountByVendorAndStatus(vendor.getVendorID(), "PENDING"))
                                .orElse(BigDecimal.ZERO);

                BigDecimal available = totalRevenue
                                .subtract(totalWithdrawn)
                                .subtract(totalPending);

                // ✅ PAGINATION
                Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

                Page<WalletTransaction> txPage = walletTransactionRepository.findByWallet_WalletID(
                                wallet.getWalletID(),
                                pageable);

                List<WalletTransactionResponse> transactions = txPage.getContent()
                                .stream()
                                .map(this::toTransactionResponse)
                                .collect(Collectors.toList());

                WalletResponse res = new WalletResponse();
                res.setBalance(wallet.getBalance());
                res.setAvailable(available);
                res.setTransactions(transactions);

                res.setPage(page);
                res.setSize(size);
                res.setTotalPages(txPage.getTotalPages());
                res.setTotalElements(txPage.getTotalElements());

                return res;
        }

        // REQUEST PAYOUT
        @Transactional
        public Map<String, Object> requestPayout(Integer userId, PayoutRequest request) {

                Vendor vendor = vendorRepository.findByUser_UserID(userId)
                                .orElseThrow(() -> new AppException("Vendor không tồn tại"));

                if (!vendor.getIsVerified()) {
                        throw new AppException("Vendor chưa verify");
                }

                BigDecimal totalRevenue = Optional.ofNullable(
                                orderRepository.sumCompletedRevenueByVendorId(vendor.getVendorID()))
                                .orElse(BigDecimal.ZERO);

                BigDecimal totalWithdrawn = Optional.ofNullable(
                                vendorPayoutRepository.sumAmountByVendorAndStatus(vendor.getVendorID(), "COMPLETED"))
                                .orElse(BigDecimal.ZERO);

                BigDecimal totalPending = Optional.ofNullable(
                                vendorPayoutRepository.sumAmountByVendorAndStatus(vendor.getVendorID(), "PENDING"))
                                .orElse(BigDecimal.ZERO);

                BigDecimal available = totalRevenue
                                .subtract(totalWithdrawn)
                                .subtract(totalPending);

                if (available.compareTo(request.getAmount()) < 0) {
                        throw new AppException("Không đủ tiền rút");
                }

                // Phí và thuế đã được tính và trừ per-order (lúc checkout),
                // nên lúc rút tiền không cần tính lại.
                BigDecimal net = request.getAmount();

                VendorPayout payout = new VendorPayout();
                payout.setVendor(vendor);
                payout.setAmount(request.getAmount());
                payout.setPlatformFee(BigDecimal.ZERO);
                payout.setTax(BigDecimal.ZERO);
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

        // MAPPER
        private WalletTransactionResponse toTransactionResponse(WalletTransaction t) {
                WalletTransactionResponse res = new WalletTransactionResponse();
                res.setType(t.getType().name());
                res.setAmount(t.getAmount());
                res.setCreatedAt(t.getCreatedAt());
                res.setDescription(t.getDescription());
                return res;
        }

        public Page<WalletTransactionResponse> getTransactions(
                        Integer userId, int page, int size,
                        LocalDate from, LocalDate to) {

                Wallet wallet = walletRepository.findByUser_UserID(userId)
                                .orElseThrow(() -> new AppException("Ví không tồn tại"));

                Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

                LocalDateTime fromDt = from != null ? from.atStartOfDay() : LocalDateTime.of(2000, 1, 1, 0, 0);
                LocalDateTime toDt = to != null ? to.atTime(23, 59, 59) : LocalDateTime.now();

                Page<WalletTransaction> txPage = walletTransactionRepository
                                .findByWallet_WalletIDAndCreatedAtBetween(
                                                wallet.getWalletID(), fromDt, toDt, pageable);

                return txPage.map(this::toTransactionResponse);
        }
}