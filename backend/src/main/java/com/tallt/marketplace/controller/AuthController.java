package com.tallt.marketplace.controller;

import com.tallt.marketplace.constant.MessageConstant;
import com.tallt.marketplace.dto.ApiResponse;
import com.tallt.marketplace.dto.AuthResponse;
import com.tallt.marketplace.dto.LoginRequest;
import com.tallt.marketplace.dto.RegisterRequest;
import com.tallt.marketplace.dto.TokenRequest;
import com.tallt.marketplace.service.AuthService;
import com.tallt.marketplace.service.UserProfileService;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserProfileService userProfileService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody @Valid LoginRequest request) {
        AuthResponse response = authService.login(request);
        if (response != null) {
            return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", response));
        } else {
            return ResponseEntity.status(401).body(ApiResponse.error(MessageConstant.LOGIN_FAILED));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@RequestBody @Valid RegisterRequest request) {
        AuthResponse result = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng ký thành công", result));
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponse>> googleLogin(@RequestBody @Valid TokenRequest request) {
        AuthResponse response = authService.googleLogin(request.getToken());
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập Google thành công", response));
    }

    /**
     * Quên mật khẩu – gửi OTP qua email
     * POST /api/auth/forgot-password
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Map<String, Object>>> forgotPassword(
            @RequestBody Map<String, String> body) {
        String email = body.get("email");
        Map<String, Object> result = userProfileService.forgotPassword(email);
        return ResponseEntity.ok(ApiResponse.success("OTP đã được gửi qua email", result));
    }

    /**
     * Xác minh OTP và đặt mật khẩu mới
     * POST /api/auth/verify-otp
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyOtpAndResetPassword(
            @RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp = body.get("otp");
        String newPassword = body.get("newPassword");
        Map<String, Object> result = userProfileService.verifyOtpAndResetPassword(email, otp, newPassword);
        return ResponseEntity.ok(ApiResponse.success("Đặt lại mật khẩu thành công", result));
    }
}

