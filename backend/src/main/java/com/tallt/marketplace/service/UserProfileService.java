package com.tallt.marketplace.service;

import com.tallt.marketplace.dto.user.UpdateProfileRequest;
import com.tallt.marketplace.entity.PasswordResetToken;
import com.tallt.marketplace.entity.User;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.repository.PasswordResetTokenRepository;
import com.tallt.marketplace.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Random;

@Service
public class UserProfileService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private EmailService emailService;

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

    /**
     * Gửi email OTP reset mật khẩu
     * - Tìm user theo email
     * - Tạo OTP 6 chữ số, lưu token (hết hạn sau 10 phút)
     * - Gửi email chứa OTP
     */
    @Transactional
    public Map<String, Object> sendPasswordResetEmail(String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new AppException("Email không tồn tại trong hệ thống");
        }

        // Xóa token cũ (nếu có)
        passwordResetTokenRepository.deleteByEmail(email);

        // Tạo OTP 6 chữ số
        String otp = String.format("%06d", new Random().nextInt(999999));

        // Lưu token
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setEmail(email);
        resetToken.setToken(otp);
        resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        passwordResetTokenRepository.save(resetToken);

        // Gửi email
        String subject = "Mã xác thực đặt lại mật khẩu - Software Marketplace";
        String body = "Xin chào " + (user.getFullName() != null ? user.getFullName() : user.getUsername()) + ",\n\n"
                + "Mã OTP đặt lại mật khẩu của bạn là: " + otp + "\n\n"
                + "Mã này có hiệu lực trong 10 phút.\n"
                + "Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.\n\n"
                + "Trân trọng,\nSoftware Marketplace";
        emailService.sendEmail(email, subject, body);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Mã OTP đã được gửi đến email " + email);
        return result;
    }

    /**
     * Xác thực OTP và đặt lại mật khẩu
     */
    @Transactional
    public Map<String, Object> resetPassword(String email, String token, String newPassword) {
        if (newPassword == null || newPassword.length() < 6) {
            throw new AppException("Mật khẩu mới phải có ít nhất 6 ký tự");
        }

        PasswordResetToken resetToken = passwordResetTokenRepository
                .findByEmailAndTokenAndUsedFalse(email, token)
                .orElseThrow(() -> new AppException("Mã OTP không hợp lệ hoặc đã được sử dụng"));

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new AppException("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới");
        }

        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new AppException("Email không tồn tại trong hệ thống");
        }

        // Đặt lại mật khẩu
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Đánh dấu token đã sử dụng
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Đặt lại mật khẩu thành công");
        return result;
    }
}
