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
            // Trúng kích hoạt trinh nữ (Lần đầu tiên dùng License) -> Tính ngày hết hạn
            if (license.getExpireAt() == null) {
                Integer durationDays = license.getTier().getDurationDays();
                if (durationDays != null && durationDays > 0) {
                    license.setExpireAt(LocalDateTime.now().plusDays(durationDays));
                    licenseRepo.save(license);
                }
            }

            // Thiết bị mới, kiểm tra giới hạn Max Devices
            int currentDevices = sessionRepo.countByLicenseAndIsActiveTrue(license);
            Integer maxDevices = license.getTier().getMaxDevices();

            if (maxDevices != null && currentDevices >= maxDevices) {
                // Xoá thiết bị cũ nhất
                java.util.List<LicenseSession> activeSessions = sessionRepo
                        .findByLicenseAndIsActiveTrueOrderByLastActiveAsc(license);
                if (!activeSessions.isEmpty()) {
                    LicenseSession oldestSession = activeSessions.get(0);
                    oldestSession.setIsActive(false);
                    sessionRepo.save(oldestSession);
                }
            }

            // Tạo mới session
            LicenseSession newSession = new LicenseSession();
            newSession.setLicense(license);
            newSession.setDeviceIdentifier(deviceId);
            newSession.setDeviceName(deviceName);
            newSession.setIpAddress(request.getRemoteAddr());
            newSession.setIsActive(true); // <-- THÊM DÒNG NÀY CHO CHẮC CÚ
            sessionRepo.save(newSession);
        }

        return ResponseEntity.ok(
                Map.of(
                        "status", "success",
                        "message", "License hợp lệ",
                        "productId", license.getProduct().getProductID()));
    }

    @PostMapping("/release")
    public ResponseEntity<?> releaseLicense(@RequestBody Map<String, String> payload) {
        String licenseKey = payload.get("licenseKey");
        String deviceId = payload.get("deviceId");

        if (licenseKey == null || licenseKey.isBlank() || deviceId == null || deviceId.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("status", "error", "message", "Thiếu licenseKey hoặc deviceId"));
        }

        Optional<License> licenseOpt = licenseRepo.findByLicenseKey(licenseKey.trim());
        if (licenseOpt.isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("status", "error", "message", "License không tồn tại"));
        }

        Optional<LicenseSession> sessionOpt = sessionRepo.findByLicenseAndDeviceIdentifier(licenseOpt.get(), deviceId);
        if (sessionOpt.isPresent()) {
            LicenseSession session = sessionOpt.get();
            session.setIsActive(false);
            sessionRepo.save(session);
            return ResponseEntity.ok(Map.of("status", "success", "message", "Đã giải phóng thiết bị"));
        }

        return ResponseEntity.ok(Map.of("status", "success", "message", "Không tìm thấy session nào"));
    }

    @PostMapping("/heartbeat")
    public ResponseEntity<?> heartbeat(@RequestBody Map<String, String> payload) {
        String licenseKey = payload.get("licenseKey");
        String deviceId = payload.get("deviceId");

        Optional<License> licenseOpt = licenseRepo.findByLicenseKey(licenseKey);
        if (licenseOpt.isEmpty())
            return ResponseEntity.status(403).build();

        Optional<LicenseSession> sessionOpt = sessionRepo.findByLicenseAndDeviceIdentifier(licenseOpt.get(), deviceId);
        if (sessionOpt.isPresent() && sessionOpt.get().getIsActive()) {
            // Update last active time to keep it fresh
            LicenseSession session = sessionOpt.get();
            session.setLastActive(LocalDateTime.now());
            sessionRepo.save(session);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.status(403).build();
    }

    @GetMapping("/{licenseKey}/sessions")
    public ResponseEntity<?> getLicenseSessions(@PathVariable String licenseKey) {
        if (licenseKey == null || licenseKey.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "License key trống"));
        }
        java.util.List<LicenseSession> sessions = sessionRepo.findByLicense_LicenseKey(licenseKey.trim());

        java.util.List<Map<String, Object>> responseList = sessions.stream().map(s -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("sessionID", s.getSessionID());
            map.put("deviceIdentifier", s.getDeviceIdentifier());
            map.put("deviceName", s.getDeviceName());
            map.put("ipAddress", s.getIpAddress());
            map.put("loginTime", s.getLoginTime());
            map.put("lastActive", s.getLastActive());
            map.put("isActive", s.getIsActive());
            return map;
        }).collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(Map.of("status", "success", "sessions", responseList));
    }
}