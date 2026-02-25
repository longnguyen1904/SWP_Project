package com.tallt.marketplace.service;

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
}
