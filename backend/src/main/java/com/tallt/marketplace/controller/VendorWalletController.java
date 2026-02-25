package com.tallt.marketplace.controller;

import com.tallt.marketplace.dto.ApiResponse;
import com.tallt.marketplace.dto.wallet.PayoutRequest;
import com.tallt.marketplace.dto.wallet.WalletResponse;
import com.tallt.marketplace.service.WalletService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
            @RequestHeader("X-User-Id") Integer userId) {
        WalletResponse result = walletService.getVendorWallet(userId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Yêu cầu rút tiền
     * POST /api/vendor/payouts
     * - Kiểm tra số dư đủ
     * - Tạo VendorPayout
     * - Trừ tiền trong Wallet
     * - Ghi nhận WalletTransaction
     */
    @PostMapping("/payouts")
    public ResponseEntity<ApiResponse<Map<String, Object>>> requestPayout(
            @RequestHeader("X-User-Id") Integer userId,
            @Valid @RequestBody PayoutRequest request) {
        Map<String, Object> result = walletService.requestPayout(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Yêu cầu rút tiền thành công", result));
    }
}
