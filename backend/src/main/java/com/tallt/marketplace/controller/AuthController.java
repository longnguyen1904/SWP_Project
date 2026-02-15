package com.tallt.marketplace.controller;

import com.tallt.marketplace.config.JwtUtils;
import com.tallt.marketplace.constant.MessageConstant;
import com.tallt.marketplace.dto.AuthResponse;
import com.tallt.marketplace.dto.LoginRequest;
import com.tallt.marketplace.dto.RegisterRequest;
import com.tallt.marketplace.entity.User;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

/**
 * Controller nhận request Đăng nhập / Đăng ký.
 * Flow: Nhận request -> Gọi Service -> Tạo Response (có Token khi Login).
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtUtils jwtUtils;

    /**
     * Flow: Gọi Service login -> Nếu thành công: tạo JWT, trả AuthResponse có accessToken.
     * Nếu thất bại: trả 401 với message.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            // Bước 1: Gọi Service xử lý logic đăng nhập
            User user = authService.login(request);

            if (user == null) {
                // Sai email/username hoặc mật khẩu -> 401
                return ResponseEntity.status(401)
                        .body(Map.of("message", MessageConstant.LOGIN_FAILED));
            }

            // Bước 2: Tạo JWT Token từ email và role
            String identifier = user.getEmail();
            String roleName = user.getRole().getRoleName();
            String accessToken = jwtUtils.generateToken(identifier, roleName);

            // Bước 3: Tạo response chứa thông tin user + Token (Frontend lưu accessToken)
            AuthResponse response = new AuthResponse(
                    user.getUserID(),
                    user.getEmail(),
                    user.getFullName(),
                    user.getRole().getRoleName(),
                    accessToken
            );
            return ResponseEntity.ok(response);

        } catch (AppException e) {
            // AppException (vd: ACCOUNT_LOCKED) -> để GlobalExceptionHandler trả 400
            throw e;
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("message", MessageConstant.SYSTEM_ERROR));
        }
    }

    /**
     * Flow: Gọi Service register -> Trả thông tin user (không có Token, user cần đăng nhập lại).
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            // Bước 1: Gọi Service xử lý đăng ký (roleID bị bỏ qua, luôn gán CUSTOMER)
            User newUser = authService.register(request);

            // Bước 2: Trả response không có Token (accessToken = null)
            AuthResponse response = new AuthResponse(
                    newUser.getUserID(),
                    newUser.getEmail(),
                    newUser.getFullName(),
                    newUser.getRole().getRoleName(),
                    null // Register không trả Token
            );
            return ResponseEntity.ok(response);

        } catch (AppException e) {
            throw e; // GlobalExceptionHandler trả 400
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("message", MessageConstant.SYSTEM_ERROR));
        }
    }
}