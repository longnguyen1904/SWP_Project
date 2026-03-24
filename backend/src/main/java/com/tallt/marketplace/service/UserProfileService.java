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

    // Characters used for random password generation
    private static final String UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
    private static final String DIGITS = "0123456789";
    private static final String ALL_CHARS = UPPERCASE + LOWERCASE + DIGITS;

    /**
     * Update user profile
     * - Update fullName
     * - Change password (verify old password, hash new password)
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
            // Must provide old password
            if (request.getOldPassword() == null || request.getOldPassword().isBlank()) {
                throw new AppException("Please enter old password");
            }

            // Verify old password
            if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
                throw new AppException("Old password is incorrect");
            }

            // Old and new must differ
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
     * Generate random password (8-10 characters)
     * Ensures at least 1 uppercase, 1 lowercase, 1 digit
     */
    private String generateRandomPassword() {
        SecureRandom random = new SecureRandom();

        // Random length 8-10 characters
        int length = 8 + random.nextInt(3);

        StringBuilder password = new StringBuilder(length);

        // Ensure at least 1 character of each type
        password.append(UPPERCASE.charAt(random.nextInt(UPPERCASE.length())));
        password.append(LOWERCASE.charAt(random.nextInt(LOWERCASE.length())));
        password.append(DIGITS.charAt(random.nextInt(DIGITS.length())));

        // Fill remaining with random characters
        for (int i = 3; i < length; i++) {
            password.append(ALL_CHARS.charAt(random.nextInt(ALL_CHARS.length())));
        }

        // Shuffle character order randomly
        char[] chars = password.toString().toCharArray();
        for (int i = chars.length - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            char temp = chars[i];
            chars[i] = chars[j];
            chars[j] = temp;
        }

        return new String(chars);
    }

    /**
     * Forgot password - generate new password and send via email
     * 1. Find user by email
     * 2. Generate random password (8-10 chars, uppercase + lowercase + digits)
     * 3. Hash new password with BCrypt and save to DB
     * 4. Send new password via email to user
     */
    @Transactional
    public Map<String, Object> forgotPassword(String email) {
        // Check email
        if (email == null || email.isBlank()) {
            throw new AppException("Please enter an email address");
        }

        // Find user by email
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new AppException("Email does not exist in the system");
        }

        // Generate random password
        String newPassword = generateRandomPassword();

        // Hash password and update in DB
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Send email with new password
        String userName = user.getFullName() != null ? user.getFullName() : user.getUsername();
        String subject = "Your New Password - Software Marketplace";
        String body = "Hello " + userName + ",\n\n"
                + "Your new password is: " + newPassword + "\n\n"
                + "Please log in and change your password immediately to ensure security.\n"
                + "If you did not request a password reset, please contact support immediately.\n\n"
                + "Best regards,\nSoftware Marketplace";
        emailService.sendEmail(email, subject, body);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "New password has been sent to email " + email);
        return result;
    }
}
