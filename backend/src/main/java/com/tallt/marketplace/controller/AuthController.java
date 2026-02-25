package com.tallt.marketplace.controller;

import com.tallt.marketplace.constant.MessageConstant;
import com.tallt.marketplace.dto.AuthResponse;
import com.tallt.marketplace.dto.LoginRequest;
import com.tallt.marketplace.dto.RegisterRequest;
import com.tallt.marketplace.entity.User;
import com.tallt.marketplace.service.AuthService;

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
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid LoginRequest request) { // Thêm @Valid
        AuthResponse response = authService.login(request);
        if (response != null) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(401).body(Map.of("message", MessageConstant.LOGIN_FAILED));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody @Valid RegisterRequest request) { // Thêm @Valid
        return ResponseEntity.ok(authService.register(request));
    }
}