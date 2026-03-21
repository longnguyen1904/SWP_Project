package com.tallt.marketplace.controller;

import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.tallt.marketplace.entity.License;
import com.tallt.marketplace.repository.LicenseRepository;

@RestController
@RequestMapping("/api/v1/licenses")
public class licenseValidationController {

    @Autowired
    private LicenseRepository licenseRepo;

    @PostMapping("/verify")
    public ResponseEntity<?> verifyLicense(@RequestBody Map<String, String> payload) {

        String licenseKey = payload.get("licenseKey");

        if (licenseKey == null || licenseKey.isBlank()) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "status", "error",
                            "message", "License key trống"));
        }

        licenseKey = licenseKey.trim();

        Optional<License> licenseOpt = licenseRepo.findByLicenseKey(licenseKey);

        if (licenseOpt.isEmpty()) {
            return ResponseEntity.status(400).body(
                    Map.of(
                            "status", "error",
                            "message", "License Key không tồn tại"));
        }

        License license = licenseOpt.get();

        if (!license.getIsActive()) {
            return ResponseEntity.status(400).body(
                    Map.of(
                            "status", "error",
                            "message", "License đã bị vô hiệu"));
        }

        if (license.getExpireAt() != null && license.getExpireAt().isBefore(java.time.LocalDateTime.now())) {
            return ResponseEntity.status(400).body(
                    Map.of(
                            "status", "error",
                            "message", "License đã hết hạn"));
        }

        return ResponseEntity.ok(
                Map.of(
                        "status", "success",
                        "message", "License hợp lệ",
                        "productId", license.getProduct().getProductID()));
    }
}