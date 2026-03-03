package com.tallt.marketplace.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.tallt.marketplace.dto.AuthResponse;
import com.tallt.marketplace.dto.LoginRequest;
import com.tallt.marketplace.dto.RegisterRequest;
import com.tallt.marketplace.entity.Role;
import com.tallt.marketplace.entity.User;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.repository.RoleRepository;
import com.tallt.marketplace.repository.UserRepository;
import com.tallt.marketplace.security.JwtUtils;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtUtils jwtUtils; // 1. Tiêm JwtUtils vào đây

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail());

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AppException("Sai email hoặc mật khẩu");
        }

        String token = jwtUtils.generateToken(user.getEmail(), user.getRole().getRoleName());
        System.out.println(">>> DEBUG LOGIN: Email = " + user.getEmail());
        System.out.println(">>> DEBUG LOGIN: Token sinh ra = " + token);
        return new AuthResponse(
                user.getEmail(),
                user.getFullName(),
                user.getRole().getRoleName(),
                token);
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException("Email đã tồn tại");
        }

        Role customerRole = roleRepository.findByRoleName("CUSTOMER")
                .orElseThrow(() -> new AppException("Hệ thống chưa cấu hình Role CUSTOMER"));

        User newUser = new User();
        newUser.setEmail(request.getEmail());
        newUser.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        newUser.setFullName(request.getFullName());
        newUser.setRole(customerRole);
        newUser.setIsActive(true);

        String username = (request.getUsername() == null || request.getUsername().isBlank())
                ? request.getEmail().split("@")[0]
                : request.getUsername();
        newUser.setUsername(username);

        userRepository.save(newUser);
        return new AuthResponse(newUser.getEmail(), newUser.getFullName(), "CUSTOMER", null);
    }
}