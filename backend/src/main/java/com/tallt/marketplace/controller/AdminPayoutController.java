package com.tallt.marketplace.controller;

import com.tallt.marketplace.config.VNPayConfig;
import com.tallt.marketplace.dto.wallet.AdminPayoutResponse;
import com.tallt.marketplace.entity.User;
import com.tallt.marketplace.entity.Wallet;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.service.AdminPayoutService;
import com.tallt.marketplace.repository.UserRepository;
import com.tallt.marketplace.repository.WalletRepository;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/payouts")
@RequiredArgsConstructor
public class AdminPayoutController {

    private final AdminPayoutService adminPayoutService;
    private final WalletRepository walletRepository;
    private final UserRepository userRepository;
    private final VNPayConfig vnPayConfig;

    @GetMapping("/admin-wallet")
    public ResponseEntity<BigDecimal> getAdminWalletBalance() {
        User admin = userRepository.findFirstByRole_RoleName("Admin");
        if (admin == null)
            throw new AppException("Không tìm thấy tài khoản Admin");

        Wallet wallet = walletRepository
                .findByUser_UserID(admin.getUserID())
                .orElseThrow(() -> new AppException("Admin wallet không tồn tại"));

        return ResponseEntity.ok(wallet.getBalance());
    }

    @GetMapping
    public ResponseEntity<Page<AdminPayoutResponse>> getAllPayouts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("payoutDate").descending());

        return ResponseEntity.ok(adminPayoutService.getAllPayouts(pageable));
    }

    @GetMapping("/pending")
    public ResponseEntity<Page<AdminPayoutResponse>> getPendingPayouts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {

        Pageable pageable = PageRequest.of(page, size);

        return ResponseEntity.ok(adminPayoutService.getPendingPayouts(pageable));
    }

    /**
     * Admin bấm Approve → tạo VNPay URL → trả paymentUrl cho frontend.
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approvePayout(
            @PathVariable Integer id,
            HttpServletRequest httpRequest) {

        String ipAddress = getClientIp(httpRequest);
        String paymentUrl = adminPayoutService.initiatePayoutApproval(id, ipAddress);

        return ResponseEntity.ok(Map.of("paymentUrl", paymentUrl));
    }

    /**
     * VNPay redirect callback — xử lý kết quả thanh toán payout.
     * Redirect sang frontend /payout-result.
     */
    @GetMapping("/vnpay-return")
    public ResponseEntity<Void> vnpayPayoutReturn(@RequestParam Map<String, String> params) {

        boolean success = adminPayoutService.processPayoutVNPayReturn(params);

        String txnRef = params.get("vnp_TxnRef");
        String payoutId = txnRef != null ? txnRef.replace("PAYOUT_", "") : "";
        String baseUrl = vnPayConfig.getFrontendUrl();

        String frontendUrl;
        if (success) {
            frontendUrl = baseUrl + "/payout-result?status=success&payoutId=" + payoutId;
        } else {
            frontendUrl = baseUrl + "/payout-result?status=failed&payoutId=" + payoutId;
        }

        return ResponseEntity.status(302)
                .header("Location", frontendUrl)
                .build();
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectPayout(@PathVariable Integer id) {

        adminPayoutService.rejectPayout(id);

        return ResponseEntity.ok("Payout rejected successfully");
    }

    // ==================== PRIVATE METHODS ====================

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty()) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip != null ? ip : "127.0.0.1";
    }
}