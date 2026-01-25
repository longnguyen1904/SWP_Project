package com.tallt.marketplace.controller;

import com.tallt.marketplace.dto.ApiResponse;
import com.tallt.marketplace.dto.LoginRequest;
import com.tallt.marketplace.dto.LoginResponse;
import com.tallt.marketplace.dto.RegisterRequest;
import com.tallt.marketplace.entity.User;
import com.tallt.marketplace.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication controller with standardized ApiResponse.
 * All endpoints return ApiResponse<T> for consistency.
 * Errors are automatically handled by GlobalExceptionHandler.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    /**
     * POST /api/auth/login
     * Authenticates a user and returns JWT token with user information.
     * 
     * @param request Login request with identifier (email/username) and password
     * @return ApiResponse containing LoginResponse with JWT token and user info
     * 
     * Possible errors (handled by GlobalExceptionHandler):
     * - USER_NOT_FOUND (404): Email/username doesn't exist
     * - INVALID_PASSWORD (401): Wrong password
     * - ACCOUNT_DISABLED (403): Account is inactive
     * - VALIDATION_ERROR (400): Invalid request format
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        LoginResponse loginResponse = authService.login(request);
        ApiResponse<LoginResponse> response = ApiResponse.success(
                "Đăng nhập thành công",
                loginResponse
        );
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/register
     * Registers a new user in the system.
     * 
     * @param request Registration request with user details
     * @return ApiResponse containing created User entity
     * 
     * Possible errors (handled by GlobalExceptionHandler):
     * - USER_EXISTED (400): Email or username already exists
     * - VALIDATION_ERROR (400): Invalid email format, password length, etc.
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<User>> register(
            @Valid @RequestBody RegisterRequest request) {
        User user = authService.register(request);
        ApiResponse<User> response = ApiResponse.success(
                "Đăng ký tài khoản thành công",
                user
        );
        return ResponseEntity.ok(response);
    }
}