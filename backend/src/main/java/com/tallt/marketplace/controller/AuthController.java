package com.tallt.marketplace.controller;

import com.tallt.marketplace.dto.LoginRequest;
import com.tallt.marketplace.dto.RegisterRequest;
import com.tallt.marketplace.entity.User;
import com.tallt.marketplace.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
// @CrossOrigin đã cấu hình ở file Config, không cần viết lại ở đây nếu dùng
// Global Config
public class AuthController {

    @Autowired
    private AuthService authService;

    // API Đăng nhập: POST http://localhost:8080/api/auth/login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        User user = authService.login(request);
        if (user != null) {
            return ResponseEntity.ok(user);
        } else {
            return ResponseEntity.status(401).body("Sai email hoặc mật khẩu!");
        }
    }

    // API Đăng ký: POST http://localhost:8080/api/auth/register
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            User newUser = authService.register(request);
            return ResponseEntity.ok(newUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}