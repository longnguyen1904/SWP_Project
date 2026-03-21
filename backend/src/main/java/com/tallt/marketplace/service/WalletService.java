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

    @Autowired
    private OrderRepository orderRepository;

    /**
     * Lấy thông tin ví của Vendor
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
     * Yêu cầu rút tiền.
     *
     * Tính available = tổng doanh thu COMPLETED (từ Orders) - tổng đã rút/đang chờ (từ VendorPayouts).
     * KHÔNG trừ ví Vendor — chỉ tạo VendorPayout(PENDING).
     * Tiền chỉ được cộng vào ví Vendor khi Admin approve.
     */
    @Transactional
    public Map<String, Object> requestPayout(Integer userId, PayoutRequest request) {
        Vendor vendor = vendorRepository.findByUser_UserID(userId)
                .orElseThrow(() -> new AppException("Vendor không tồn tại"));

        if (!vendor.getIsVerified()) {
            throw new AppException("Vendor chưa được xác thực, không thể rút tiền");
        }

        // Tính doanh thu từ bảng Orders (COMPLETED orders cho sản phẩm của vendor)
        BigDecimal totalRevenue = orderRepository.sumCompletedRevenueByVendorId(vendor.getVendorID());

        // Tính tổng đã rút + đang chờ duyệt
        BigDecimal totalWithdrawn = vendorPayoutRepository
                .sumAmountByVendorAndStatus(vendor.getVendorID(), "COMPLETED");
        BigDecimal totalPending = vendorPayoutRepository
                .sumAmountByVendorAndStatus(vendor.getVendorID(), "PENDING");

        BigDecimal available = totalRevenue.subtract(totalWithdrawn).subtract(totalPending);

        if (available.compareTo(request.getAmount()) < 0) {
            throw new AppException("Số tiền có thể rút không đủ. "
                    + "Doanh thu: " + totalRevenue
                    + ", Đã rút/đang chờ: " + totalWithdrawn.add(totalPending)
                    + ", Có thể rút: " + available);
        }

        // Tạo VendorPayout — KHÔNG trừ ví
        VendorPayout payout = new VendorPayout();
        payout.setVendor(vendor);
        payout.setAmount(request.getAmount());
        payout.setPayoutDate(LocalDateTime.now());
        payout.setStatus("PENDING");
        vendorPayoutRepository.save(payout);

        return Map.of(
                "payoutId", payout.getPayoutID(),
                "amount", payout.getAmount(),
                "status", payout.getStatus(),
                "availableAfter", available.subtract(request.getAmount()),
                "message", "Yêu cầu rút tiền đã được gửi, chờ Admin duyệt"
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

