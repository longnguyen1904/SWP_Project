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

    // Ký tự dùng để sinh mật khẩu ngẫu nhiên
    private static final String UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
    private static final String DIGITS = "0123456789";
    private static final String ALL_CHARS = UPPERCASE + LOWERCASE + DIGITS;

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
     * Sinh mật khẩu ngẫu nhiên (8-10 ký tự)
     * Đảm bảo chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số
     */
    private String generateRandomPassword() {
        SecureRandom random = new SecureRandom();

        // Độ dài ngẫu nhiên 8-10 ký tự
        int length = 8 + random.nextInt(3);

        StringBuilder password = new StringBuilder(length);

        // Đảm bảo ít nhất 1 ký tự mỗi loại
        password.append(UPPERCASE.charAt(random.nextInt(UPPERCASE.length())));
        password.append(LOWERCASE.charAt(random.nextInt(LOWERCASE.length())));
        password.append(DIGITS.charAt(random.nextInt(DIGITS.length())));

        // Điền phần còn lại ngẫu nhiên
        for (int i = 3; i < length; i++) {
            password.append(ALL_CHARS.charAt(random.nextInt(ALL_CHARS.length())));
        }

        // Trộn ngẫu nhiên thứ tự các ký tự
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
     * Quên mật khẩu – sinh mật khẩu mới và gửi qua email
     * 1. Tìm user theo email
     * 2. Sinh mật khẩu ngẫu nhiên (8-10 ký tự, chữ hoa + chữ thường + số)
     * 3. Hash mật khẩu mới bằng BCrypt và lưu vào DB
     * 4. Gửi mật khẩu mới qua email cho user
     */
    @Transactional
    public Map<String, Object> forgotPassword(String email) {
        // Kiểm tra email
        if (email == null || email.isBlank()) {
            throw new AppException("Vui lòng nhập email");
        }

        // Tìm user theo email
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new AppException("Email không tồn tại trong hệ thống");
        }

        // Sinh mật khẩu ngẫu nhiên
        String newPassword = generateRandomPassword();

        // Hash mật khẩu và cập nhật vào DB
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Gửi email chứa mật khẩu mới
        String userName = user.getFullName() != null ? user.getFullName() : user.getUsername();
        String subject = "Mật khẩu mới của bạn - Software Marketplace";
        String body = "Xin chào " + userName + ",\n\n"
                + "Mật khẩu mới của bạn là: " + newPassword + "\n\n"
                + "Vui lòng đăng nhập và đổi mật khẩu ngay để đảm bảo an toàn.\n"
                + "Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng liên hệ hỗ trợ ngay.\n\n"
                + "Trân trọng,\nSoftware Marketplace";
        emailService.sendEmail(email, subject, body);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Mật khẩu mới đã được gửi đến email " + email);
        return result;
    }
}
