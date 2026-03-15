package com.tallt.marketplace.service;

import com.tallt.marketplace.dto.user.UpdateProfileRequest;
import com.tallt.marketplace.entity.User;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class UserProfileService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Cập nhật thông tin cá nhân
     * - Cập nhật fullName
     * - Đổi mật khẩu (kiểm tra mật khẩu cũ, hash mật khẩu mới)
     */
    @Transactional
    public Map<String, Object> updateProfile(Integer userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User không tồn tại"));

        // Update fullName if provided
        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName());
        }

        // Update password if provided
        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            // Must provide old password
            if (request.getOldPassword() == null || request.getOldPassword().isBlank()) {
                throw new AppException("Vui lòng nhập mật khẩu cũ");
            }

            // Verify old password
            if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
                throw new AppException("Mật khẩu cũ không chính xác");
            }

            // Old and new must differ
            if (request.getOldPassword().equals(request.getNewPassword())) {
                throw new AppException("Mật khẩu mới phải khác mật khẩu cũ");
            }

            user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        }

        userRepository.save(user);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("userId", user.getUserID());
        result.put("fullName", user.getFullName());
        result.put("email", user.getEmail());
        result.put("message", "Cập nhật thông tin thành công");
        return result;
    }

    /**
     * Lấy thông tin cá nhân
     */
    public Map<String, Object> getProfile(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User không tồn tại"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("userId", user.getUserID());
        result.put("email", user.getEmail());
        result.put("fullName", user.getFullName() != null ? user.getFullName() : "");
        result.put("username", user.getUsername() != null ? user.getUsername() : "");
        result.put("role", user.getRole().getRoleName());
        result.put("isActive", user.getIsActive());
        result.put("createdAt", user.getCreatedAt().toString());
        return result;
    }
}
