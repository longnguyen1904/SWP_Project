package com.tallt.marketplace.controller;

import com.tallt.marketplace.dto.wallet.AdminPayoutResponse;
import com.tallt.marketplace.entity.User;
import com.tallt.marketplace.entity.Wallet;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.service.AdminPayoutService;
import com.tallt.marketplace.repository.UserRepository;
import com.tallt.marketplace.repository.WalletRepository;

import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;

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

    @GetMapping("/admin-wallet")
    public ResponseEntity<BigDecimal> getAdminWalletBalance() {
        User admin = userRepository.findFirstByRole_RoleName("Admin");
        if (admin == null) throw new AppException("Không tìm thấy tài khoản Admin");

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


    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approvePayout(@PathVariable Integer id) {

        adminPayoutService.approvePayout(id);

        return ResponseEntity.ok("Payout approved successfully");
    }


    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectPayout(@PathVariable Integer id) {

        adminPayoutService.rejectPayout(id);

        return ResponseEntity.ok("Payout rejected successfully");
    }
}