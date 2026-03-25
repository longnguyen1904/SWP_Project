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
import java.util.Optional;
import java.util.UUID;

import com.tallt.marketplace.constant.MessageConstant;
import com.tallt.marketplace.constant.RoleConstant;
import com.tallt.marketplace.dto.AuthResponse;
import com.tallt.marketplace.dto.LoginRequest;
import com.tallt.marketplace.dto.RegisterRequest;
import com.tallt.marketplace.entity.Role;
import com.tallt.marketplace.entity.User;
import com.tallt.marketplace.entity.Vendor;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.repository.RoleRepository;
import com.tallt.marketplace.repository.UserRepository;
import com.tallt.marketplace.repository.VendorRepository;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private PasswordEncoder passwordEncoder; // Inject Bean vừa tạo
    @Autowired
    private VendorRepository vendorRepository;

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail());

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AppException("Invalid email or password");
        }

        // 👉 tạo token phiên đăng nhập
        String token = "TOKEN_" + user.getUserID() + "_" + System.currentTimeMillis();

        // 👉 Kiểm tra vendor status (nếu là vendor)
        String vendorStatus = null;
        String suspendReason = null;
        Optional<Vendor> vendorOpt = vendorRepository.findByUser_UserID(user.getUserID());
        if (vendorOpt.isPresent()) {
            Vendor vendor = vendorOpt.get();
            vendorStatus = vendor.getStatus().name();
            if (vendor.getStatus() == Vendor.VendorStatus.SUSPENDED) {
                suspendReason = vendor.getRejectionNote();
            }
        }

        return new AuthResponse(
                user.getEmail(),
                user.getFullName(),
                user.getRole().getRoleName(),
                token,
                user.getUserID(),
                vendorStatus,
                suspendReason);
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
                    Map.class);

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
                    user.getUserID());

        } catch (Exception e) {
            throw new AppException("Failed to verify Google token: " + e.getMessage());
        }
    }
}