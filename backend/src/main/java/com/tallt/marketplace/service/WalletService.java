package com.tallt.marketplace.service;

import com.tallt.marketplace.dto.wallet.PayoutRequest;
import com.tallt.marketplace.dto.wallet.WalletResponse;
import com.tallt.marketplace.dto.wallet.WalletTransactionResponse;
import com.tallt.marketplace.entity.*;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
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

    /**
     * Lấy thông tin ví của Vendor
     * - Bao gồm balance và danh sách giao dịch
     */
    public WalletResponse getVendorWallet(Integer userId) {
        Wallet wallet = walletRepository.findByUser_UserID(userId)
                .orElseThrow(() -> new AppException("Ví không tồn tại. Vui lòng liên hệ admin."));

        List<WalletTransaction> transactions = walletTransactionRepository
                .findByWallet_WalletIDOrderByCreatedAtDesc(wallet.getWalletID());

        List<WalletTransactionResponse> transactionResponses = transactions.stream()
                .map(this::toTransactionResponse)
                .collect(Collectors.toList());

        WalletResponse response = new WalletResponse();
        response.setBalance(wallet.getBalance());
        response.setTransactions(transactionResponses);
        return response;
    }

    /**
     * Yêu cầu rút tiền
     * - Kiểm tra số dư đủ
     * - Tạo VendorPayout
     * - Trừ tiền trong Wallet
     * - Ghi nhận WalletTransaction
     */
    @Transactional
    public Map<String, Object> requestPayout(Integer userId, PayoutRequest request) {
        // 1. Lấy Vendor
        Vendor vendor = vendorRepository.findByUser_UserID(userId)
                .orElseThrow(() -> new AppException("Vendor không tồn tại"));

        if (!vendor.getIsVerified()) {
            throw new AppException("Vendor chưa được xác thực, không thể rút tiền");
        }

        // 2. Lấy Wallet
        Wallet wallet = walletRepository.findByUser_UserID(userId)
                .orElseThrow(() -> new AppException("Ví không tồn tại"));

        // 3. Kiểm tra số dư
        if (wallet.getBalance().compareTo(request.getAmount()) < 0) {
            throw new AppException("Số dư không đủ để rút tiền. Số dư hiện tại: " + wallet.getBalance());
        }

        // 4. Tạo VendorPayout
        VendorPayout payout = new VendorPayout();
        payout.setVendor(vendor);
        payout.setAmount(request.getAmount());
        payout.setPayoutDate(LocalDateTime.now());
        payout.setStatus("PENDING");
        vendorPayoutRepository.save(payout);

        // 5. Trừ tiền trong Wallet
        wallet.setBalance(wallet.getBalance().subtract(request.getAmount()));
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);

        // 6. Ghi nhận WalletTransaction
        WalletTransaction transaction = new WalletTransaction();
        transaction.setWallet(wallet);
        transaction.setAmount(request.getAmount().negate());
        transaction.setType(WalletTransaction.TransactionType.WITHDRAWAL);
        transaction.setReferenceID(payout.getPayoutID());
        transaction.setDescription("Yêu cầu rút tiền #" + payout.getPayoutID());
        walletTransactionRepository.save(transaction);

        return Map.of(
                "payoutId", payout.getPayoutID(),
                "amount", payout.getAmount(),
                "status", payout.getStatus(),
                "message", "Yêu cầu rút tiền đã được gửi thành công"
        );
    }

    // ==================== HELPER METHODS ====================

    private WalletTransactionResponse toTransactionResponse(WalletTransaction transaction) {
        WalletTransactionResponse response = new WalletTransactionResponse();
        response.setType(transaction.getType().name());
        response.setAmount(transaction.getAmount());
        response.setCreatedAt(transaction.getCreatedAt());
        response.setDescription(transaction.getDescription());
        return response;
    }
}
