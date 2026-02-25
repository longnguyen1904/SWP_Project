package com.tallt.marketplace.service;

<<<<<<< HEAD
import com.tallt.marketplace.dto.user.UpdateProfileRequest;
import com.tallt.marketplace.entity.User;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class UserProfileService {

    @Autowired
    private UserRepository userRepository;

    /**
     * Cập nhật thông tin cá nhân
     * - Cập nhật fullName, password (hash)
     */
    @Transactional
    public Map<String, Object> updateProfile(Integer userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User không tồn tại"));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName());
        }

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            // TODO: Sử dụng BCryptPasswordEncoder khi có Spring Security
            user.setPasswordHash(request.getPassword());
        }

        userRepository.save(user);

        return Map.of(
                "userId", user.getUserID(),
                "fullName", user.getFullName(),
                "email", user.getEmail(),
                "message", "Cập nhật thông tin thành công"
        );
    }

    /**
     * Lấy thông tin cá nhân
     */
    public Map<String, Object> getProfile(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User không tồn tại"));

        return Map.of(
                "userId", user.getUserID(),
                "email", user.getEmail(),
                "fullName", user.getFullName() != null ? user.getFullName() : "",
                "username", user.getUsername() != null ? user.getUsername() : "",
                "role", user.getRole().getRoleName(),
                "isActive", user.getIsActive(),
                "createdAt", user.getCreatedAt().toString()
        );
    }
=======
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.tallt.marketplace.dto.UpdateProfileRequest;
import com.tallt.marketplace.entity.User;
import com.tallt.marketplace.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
public void updateProfile(UpdateProfileRequest request) {

    User user = userRepository.findById(request.getUserId())
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "User not found"
                )
            );

    // Update full name
    if (request.getFullName() != null && !request.getFullName().isBlank()) {
        user.setFullName(request.getFullName());
    }

    // Update password
    if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {

        if (request.getOldPassword() == null ||
            !passwordEncoder.matches(
                    request.getOldPassword(),
                    user.getPasswordHash())) {

            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Old password is incorrect"
            );
        }
        user.setPasswordHash(
                passwordEncoder.encode(request.getNewPassword()));
    }

    userRepository.save(user);
}

>>>>>>> a2a09c3a7a25716178ee1a006acc5464266ec17e
}
