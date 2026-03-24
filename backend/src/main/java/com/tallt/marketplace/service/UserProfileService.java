package com.tallt.marketplace.service;

import com.tallt.marketplace.dto.user.UpdateProfileRequest;
import com.tallt.marketplace.entity.User;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class UserProfileService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int MAX_OTP_ATTEMPTS = 5;

    /**
     * Update user profile
     */
    @Transactional
    public Map<String, Object> updateProfile(Integer userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User does not exist"));

        // Update fullName if provided
        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName());
        }

        // Update password if provided
        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            if (request.getOldPassword() == null || request.getOldPassword().isBlank()) {
                throw new AppException("Please enter old password");
            }
            if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
                throw new AppException("Old password is incorrect");
            }
            if (request.getOldPassword().equals(request.getNewPassword())) {
                throw new AppException("New password must be different from old password");
            }
            user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        }

        userRepository.save(user);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("userId", user.getUserID());
        result.put("fullName", user.getFullName());
        result.put("email", user.getEmail());
        result.put("message", "Profile updated successfully");
        return result;
    }

    /**
     * Get user profile
     */
    public Map<String, Object> getProfile(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User does not exist"));

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

    /**
     * Generate OTP (6 digits)
     */
    private String generateOtp() {
        SecureRandom random = new SecureRandom();
        StringBuilder otp = new StringBuilder(OTP_LENGTH);
        for (int i = 0; i < OTP_LENGTH; i++) {
            otp.append(random.nextInt(10));
        }
        return otp.toString();
    }

    /**
     * Forgot password – generate OTP and send via email
     * 1. Find user by email
     * 2. Generate 6-digit OTP
     * 3. Save OTP + expiry (5 minutes) to DB
     * 4. Send OTP via email
     */
    @Transactional
    public Map<String, Object> forgotPassword(String email) {
        if (email == null || email.isBlank()) {
            throw new AppException("Please enter an email address");
        }

        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new AppException("Email does not exist in the system");
        }

        // Generate OTP and save
        String otp = generateOtp();
        user.setOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        user.setOtpAttempts(0);
        userRepository.save(user);

        // Send OTP via email
        String userName = user.getFullName() != null ? user.getFullName() : user.getUsername();
        String subject = "Password Reset OTP - Software Marketplace";
        String body = "Hello " + userName + ",\n\n"
                + "Your OTP code is: " + otp + "\n\n"
                + "This code will expire in " + OTP_EXPIRY_MINUTES + " minutes.\n"
                + "If you did not request a password reset, please ignore this email.\n\n"
                + "Best regards,\nSoftware Marketplace";
        emailService.sendEmail(email, subject, body);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "OTP has been sent to email " + email);
        return result;
    }

    /**
     * Verify OTP and reset password
     * 1. Find user by email
     * 2. Verify OTP is valid and not expired
     * 3. Check attempt count (max 5)
     * 4. If valid, hash new password and save
     * 5. Clear OTP fields
     */
    @Transactional
    public Map<String, Object> verifyOtpAndResetPassword(String email, String otp, String newPassword) {
        if (email == null || email.isBlank()) {
            throw new AppException("Please enter an email address");
        }
        if (otp == null || otp.isBlank()) {
            throw new AppException("Please enter OTP code");
        }
        if (newPassword == null || newPassword.isBlank()) {
            throw new AppException("Please enter new password");
        }
        if (newPassword.length() < 6) {
            throw new AppException("Password must be at least 6 characters");
        }

        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new AppException("Email does not exist in the system");
        }

        // Check if OTP exists
        if (user.getOtp() == null) {
            throw new AppException("No OTP request found. Please request a new OTP.");
        }

        // Check max attempts
        if (user.getOtpAttempts() != null && user.getOtpAttempts() >= MAX_OTP_ATTEMPTS) {
            // Clear OTP on too many attempts
            user.setOtp(null);
            user.setOtpExpiry(null);
            user.setOtpAttempts(0);
            userRepository.save(user);
            throw new AppException("Too many failed attempts. Please request a new OTP.");
        }

        // Check expiry
        if (user.getOtpExpiry() == null || LocalDateTime.now().isAfter(user.getOtpExpiry())) {
            user.setOtp(null);
            user.setOtpExpiry(null);
            user.setOtpAttempts(0);
            userRepository.save(user);
            throw new AppException("OTP has expired. Please request a new OTP.");
        }

        // Check OTP match
        if (!otp.equals(user.getOtp())) {
            user.setOtpAttempts((user.getOtpAttempts() != null ? user.getOtpAttempts() : 0) + 1);
            userRepository.save(user);
            int remaining = MAX_OTP_ATTEMPTS - user.getOtpAttempts();
            throw new AppException("Invalid OTP. " + remaining + " attempts remaining.");
        }

        // OTP valid – reset password
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setOtp(null);
        user.setOtpExpiry(null);
        user.setOtpAttempts(0);
        userRepository.save(user);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Password has been reset successfully");
        return result;
    }
}
