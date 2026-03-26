package com.tallt.marketplace.controller;

import com.tallt.marketplace.dto.ApiResponse;
import com.tallt.marketplace.dto.wallet.PayoutRequest;
import com.tallt.marketplace.dto.wallet.WalletResponse;
import com.tallt.marketplace.dto.wallet.WalletTransactionResponse;
import com.tallt.marketplace.service.WalletService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

/**
 * Controller quản lý ví và rút tiền của Vendor
 * UC – Vendor Revenue & Wallet
 * UC – Vendor Payout
 */
@RestController
@RequestMapping("/api/vendor")
public class VendorWalletController {

    @Autowired
    private WalletService walletService;

    /**
     * Lấy thông tin ví của Vendor
     * GET /api/vendor/wallet
     * - Bao gồm balance và danh sách giao dịch
     */
    @GetMapping("/wallet")
    public ResponseEntity<ApiResponse<WalletResponse>> getVendorWallet(
            @RequestHeader("X-User-Id") Integer userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        WalletResponse result = walletService.getVendorWallet(userId, page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Yêu cầu rút tiền
     * POST /api/vendor/payouts
     * - Tính available từ Orders - đã rút/pending
     * - Tạo VendorPayout(PENDING)
     * - Tiền cộng vào ví khi Admin approve
     */
    @PostMapping("/payouts")
    public ResponseEntity<ApiResponse<Map<String, Object>>> requestPayout(
            @RequestHeader("X-User-Id") Integer userId,
            @Valid @RequestBody PayoutRequest request) {
        Map<String, Object> result = walletService.requestPayout(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Yêu cầu rút tiền thành công", result));
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<Page<WalletTransactionResponse>>> getTransactions(
            @RequestHeader("X-User-Id") Integer userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.success(
                walletService.getTransactions(userId, page, size, from, to)));
    }

}
