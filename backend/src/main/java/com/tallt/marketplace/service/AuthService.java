package com.tallt.marketplace.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import java.util.Map;
import java.util.UUID;

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

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
public class AuthService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCKOUT_DURATION_MINUTES = 5;

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail());

        if (user == null) {
            throw new AppException("Invalid email or password");
        }

        // Check if account is locked
        if (user.getLockoutUntil() != null && LocalDateTime.now().isBefore(user.getLockoutUntil())) {
            long secondsLeft = ChronoUnit.SECONDS.between(LocalDateTime.now(), user.getLockoutUntil());
            long minutesLeft = (secondsLeft / 60) + 1;
            throw new AppException("Tài khoản bị khóa tạm thời. Thử lại sau " + minutesLeft + " phút.");
        }

        // If lockout has expired, reset counters
        if (user.getLockoutUntil() != null && LocalDateTime.now().isAfter(user.getLockoutUntil())) {
            user.setFailedLoginAttempts(0);
            user.setLockoutUntil(null);
        }

        // Check password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            int attempts = (user.getFailedLoginAttempts() != null ? user.getFailedLoginAttempts() : 0) + 1;
            user.setFailedLoginAttempts(attempts);

            if (attempts >= MAX_FAILED_ATTEMPTS) {
                user.setLockoutUntil(LocalDateTime.now().plusMinutes(LOCKOUT_DURATION_MINUTES));
                userRepository.save(user);
                throw new AppException("Sai mật khẩu " + MAX_FAILED_ATTEMPTS + " lần. Tài khoản bị khóa " + LOCKOUT_DURATION_MINUTES + " phút.");
            }

            userRepository.save(user);
            int remaining = MAX_FAILED_ATTEMPTS - attempts;
            throw new AppException("Sai mật khẩu. Còn " + remaining + " lần thử trước khi bị khóa.");
        }

        // Login success → reset lockout
        user.setFailedLoginAttempts(0);
        user.setLockoutUntil(null);
        userRepository.save(user);

        String token = "TOKEN_" + user.getUserID() + "_" + System.currentTimeMillis();

        return new AuthResponse(
                user.getEmail(),
                user.getFullName(),
                user.getRole().getRoleName(),
                token,
                user.getUserID()
        );
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(MessageConstant.EMAIL_ALREADY_EXISTS);
        }

        Integer roleIdWrapper = request.getRoleID();
        int roleId = (roleIdWrapper != null) ? roleIdWrapper : RoleConstant.CUSTOMER;
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

        // Ensure username value is used
        String username = request.getUsername();
        if (username == null || username.isBlank()) {
            username = request.getEmail().split("@")[0];
        }

        newUser.setUsername(username);

        User savedUser = userRepository.save(newUser);

        return new AuthResponse(
                savedUser.getEmail(),
                savedUser.getFullName(),
                role.getRoleName(),
                null,
                savedUser.getUserID());
    }

    public AuthResponse googleLogin(String googleAccessToken) {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(googleAccessToken);
        HttpEntity<?> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    HttpMethod.GET,
                    entity,
                    Map.class
            );

            Map<String, Object> payload = response.getBody();
            if (payload == null || !payload.containsKey("email")) {
                throw new AppException("Invalid Google Token");
            }

            String email = (String) payload.get("email");
            String name = (String) payload.get("name");

            User user = userRepository.findByEmail(email);
            if (user == null) {
                Role role = roleRepository.findById(RoleConstant.CUSTOMER)
                        .orElseThrow(() -> new AppException(MessageConstant.ROLE_NOT_FOUND));

                user = new User();
                user.setEmail(email);
                user.setFullName(name);
                user.setUsername(email.split("@")[0]);
                user.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
                user.setRole(role);
                user.setIsActive(true);
                user = userRepository.save(user);
            }

            String token = "TOKEN_" + user.getUserID() + "_" + System.currentTimeMillis();

            return new AuthResponse(
                    user.getEmail(),
                    user.getFullName(),
                    user.getRole().getRoleName(),
                    token,
                    user.getUserID()
            );

        } catch (Exception e) {
            throw new AppException("Failed to verify Google token: " + e.getMessage());
        }
    }
}