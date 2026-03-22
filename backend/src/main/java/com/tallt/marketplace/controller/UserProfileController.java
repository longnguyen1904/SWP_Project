package com.tallt.marketplace.controller;

import com.tallt.marketplace.dto.ApiResponse;
import com.tallt.marketplace.dto.user.UpdateProfileRequest;
import com.tallt.marketplace.service.UserProfileService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller cập nhật thông tin cá nhân
 * UC23 – Profile Settings
 */
@RestController
@RequestMapping("/api/users")
public class UserProfileController {

    @Autowired
    private UserProfileService userProfileService;

    /**
     * Cập nhật thông tin cá nhân
     * PUT /api/users/profile
     * - Cập nhật fullName, password (hash)
     */
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateProfile(
            @RequestHeader("X-User-Id") Integer userId,
            @Valid @RequestBody UpdateProfileRequest request) {
        Map<String, Object> result = userProfileService.updateProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin thành công", result));
    }

    /**
     * Lấy thông tin cá nhân
     * GET /api/users/profile
     */
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProfile(
            @RequestHeader("X-User-Id") Integer userId) {
        Map<String, Object> result = userProfileService.getProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Gửi OTP reset mật khẩu qua email
     * POST /api/users/forgot-password
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Map<String, Object>>> forgotPassword(
            @RequestBody Map<String, String> body) {
        String email = body.get("email");
        Map<String, Object> result = userProfileService.sendPasswordResetEmail(email);
        return ResponseEntity.ok(ApiResponse.success("Đã gửi mã OTP", result));
    }

    /**
     * Xác thực OTP và đặt lại mật khẩu
     * POST /api/users/reset-password
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resetPassword(
            @RequestBody Map<String, String> body) {
        String email = body.get("email");
        String token = body.get("token");
        String newPassword = body.get("newPassword");
        Map<String, Object> result = userProfileService.resetPassword(email, token, newPassword);
        return ResponseEntity.ok(ApiResponse.success("Đặt lại mật khẩu thành công", result));
    }
}
