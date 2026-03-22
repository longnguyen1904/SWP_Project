package com.tallt.marketplace.controller;

import java.util.Map;
import java.util.Optional;
import java.time.LocalDateTime;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.tallt.marketplace.entity.License;
import com.tallt.marketplace.entity.LicenseSession;
import com.tallt.marketplace.repository.LicenseRepository;
import com.tallt.marketplace.repository.LicenseSessionRepository;

@RestController
@RequestMapping("/api/v1/licenses")
public class licenseValidationController {

    @Autowired
    private LicenseRepository licenseRepo;

    @Autowired
    private LicenseSessionRepository sessionRepo;

    @PostMapping("/verify")
    public ResponseEntity<?> verifyLicense(@RequestBody Map<String, String> payload, HttpServletRequest request) {

        String licenseKey = payload.get("licenseKey");
        String deviceId = payload.get("deviceId");
        String deviceName = payload.get("deviceName");

        if (licenseKey == null || licenseKey.isBlank()) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "status", "error",
                            "message", "License key trống"));
        }
        if (deviceId == null || deviceId.isBlank()) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "status", "error",
                            "message", "Thiếu định danh thiết bị (deviceId)"));
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

        if (license.getExpireAt() != null && license.getExpireAt().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(400).body(
                    Map.of(
                            "status", "error",
                            "message", "License đã hết hạn"));
        }

        // Logic check Max Devices
        Optional<LicenseSession> sessionOpt = sessionRepo.findByLicenseAndDeviceIdentifier(license, deviceId);
        
        if (sessionOpt.isPresent()) {
            // Thiết bị đã từng đăng nhập, cập nhật lại LastActive
            LicenseSession session = sessionOpt.get();
            session.setLastActive(LocalDateTime.now());
            session.setIsActive(true);
            if (deviceName != null && !deviceName.isBlank()) {
                session.setDeviceName(deviceName);
            }
            session.setIpAddress(request.getRemoteAddr());
            sessionRepo.save(session);
        } else {
            // Thiết bị mới, kiểm tra giới hạn Max Devices
            int currentDevices = sessionRepo.countByLicenseAndIsActiveTrue(license);
            Integer maxDevices = license.getTier().getMaxDevices();
            
            if (maxDevices != null && currentDevices >= maxDevices) {
                return ResponseEntity.status(403).body(
                        Map.of(
                                "status", "error",
                                "message", "License này đã đạt giới hạn thiết bị tối đa (" + maxDevices + ")"));
            }
            
            // Tạo mới session
            LicenseSession newSession = new LicenseSession();
            newSession.setLicense(license);
            newSession.setDeviceIdentifier(deviceId);
            newSession.setDeviceName(deviceName);
            newSession.setIpAddress(request.getRemoteAddr());
            sessionRepo.save(newSession);
        }

        return ResponseEntity.ok(
                Map.of(
                        "status", "success",
                        "message", "License hợp lệ",
                        "productId", license.getProduct().getProductID()));
    }
}