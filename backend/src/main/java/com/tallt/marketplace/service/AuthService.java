package com.tallt.marketplace.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.tallt.marketplace.constant.MessageConstant;
import com.tallt.marketplace.constant.RoleConstant;
import com.tallt.marketplace.dto.AuthResponse;
import com.tallt.marketplace.dto.LoginRequest;
import com.tallt.marketplace.dto.RegisterRequest;
import com.tallt.marketplace.entity.Role;
import com.tallt.marketplace.entity.User;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.repository.RoleRepository;
import com.tallt.marketplace.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private PasswordEncoder passwordEncoder; // Inject Bean vừa tạo

    public AuthResponse login(LoginRequest request) {
    User user = userRepository.findByEmail(request.getEmail());

    if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
        throw new AppException("Invalid email or password");
    }

    // 👉 tạo token phiên đăng nhập
    String token = "TOKEN_" + user.getUserID() + "_" + System.currentTimeMillis();

    return new AuthResponse(
            user.getEmail(),
            user.getFullName(),
            user.getRole().getRoleName(),
            token
    );
}

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(MessageConstant.EMAIL_ALREADY_EXISTS);
        }

        int roleId = (request.getRoleID() != null) ? request.getRoleID() : RoleConstant.CUSTOMER;
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new AppException(MessageConstant.ROLE_NOT_FOUND));

        User newUser = new User();
        newUser.setEmail(request.getEmail());

        // MÃ HÓA MẬT KHẨU TRƯỚC KHI LƯU
        newUser.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        String generatedUsername = request.getEmail().split("@")[0];
        newUser.setUsername(generatedUsername);
        newUser.setFullName(request.getFullName());
        newUser.setRole(role);
        newUser.setIsActive(true);
    String username = request.getUsername();
    if (username == null || username.isBlank()) {
        username = request.getEmail().split("@")[0];
    }

        User savedUser = userRepository.save(newUser);

        return new AuthResponse(
                savedUser.getEmail(),
                savedUser.getFullName(),
                role.getRoleName(),
                null);
    }
}