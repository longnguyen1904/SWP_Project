package com.tallt.marketplace.controller;

import com.tallt.marketplace.constant.MessageConstant;
import com.tallt.marketplace.dto.LoginRequest;
import com.tallt.marketplace.dto.RegisterRequest;
import com.tallt.marketplace.entity.User;
import com.tallt.marketplace.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    // POST /api/auth/login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        User user = authService.login(request);
        if (user != null) {
            return ResponseEntity.ok(user);
        } else {
            // Trả về message từ Constant
            return ResponseEntity.status(401).body(MessageConstant.LOGIN_FAILED);
        }
    }

    // POST /api/auth/register
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        // Nếu có lỗi (trùng email...), ExceptionHandler sẽ bắt và trả về lỗi 400
        return ResponseEntity.ok(authService.register(request));
    }
}