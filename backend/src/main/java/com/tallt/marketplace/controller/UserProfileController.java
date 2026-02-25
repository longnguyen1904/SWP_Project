package com.tallt.marketplace.controller;

<<<<<<< HEAD
import com.tallt.marketplace.dto.ApiResponse;
import com.tallt.marketplace.dto.user.UpdateProfileRequest;
import com.tallt.marketplace.service.UserProfileService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller cập nhật thông tin cá nhân
 * UC23 – Profile Settings
 */
@RestController
@RequestMapping("/api/users")
public class UserProfileController {

    @Autowired
    private UserProfileService userProfileService;

    /**
     * Cập nhật thông tin cá nhân
     * PUT /api/users/profile
     * - Cập nhật fullName, password (hash)
     */
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateProfile(
            @RequestHeader("X-User-Id") Integer userId,
            @Valid @RequestBody UpdateProfileRequest request) {
        Map<String, Object> result = userProfileService.updateProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin thành công", result));
    }

    /**
     * Lấy thông tin cá nhân
     * GET /api/users/profile
     */
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProfile(
            @RequestHeader("X-User-Id") Integer userId) {
        Map<String, Object> result = userProfileService.getProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
=======
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tallt.marketplace.dto.UpdateProfileRequest;
import com.tallt.marketplace.service.UserProfileService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;

    /**
     * UC23 – Change personal information
     */
    
    @PutMapping("/update")
    public ResponseEntity<?> updateProfile(
            @RequestBody UpdateProfileRequest request) {

        userProfileService.updateProfile(request);

        return ResponseEntity.ok("Profile updated successfully");
    }


>>>>>>> a2a09c3a7a25716178ee1a006acc5464266ec17e
}
