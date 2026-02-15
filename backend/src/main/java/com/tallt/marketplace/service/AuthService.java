package com.tallt.marketplace.service;

import com.tallt.marketplace.constant.MessageConstant;
import com.tallt.marketplace.constant.RoleConstant;
import com.tallt.marketplace.dto.LoginRequest;
import com.tallt.marketplace.dto.RegisterRequest;
import com.tallt.marketplace.entity.Role;
import com.tallt.marketplace.entity.User;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.repository.RoleRepository;
import com.tallt.marketplace.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Service xử lý logic Đăng nhập và Đăng ký.
 * Flow: Controller gọi Service -> Service trả User -> Controller tạo Token và Response.
 */
@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Flow: Tìm user theo identifier (email hoặc username) -> Kiểm tra mật khẩu -> Kiểm tra active.
     * Trả về User nếu thành công, null nếu sai thông tin. Token do Controller tạo.
     */
    public User login(LoginRequest request) {
        // Bước 1: Tìm user theo email HOẶC username (identifier dùng chung)
        User user = userRepository.findByEmailOrUsername(
                request.getIdentifier(),
                request.getIdentifier()
        );

        // Bước 2: Nếu không tìm thấy user -> trả null
        if (user == null) {
            return null;
        }

        // Bước 3: So sánh mật khẩu (Bcrypt)
        boolean passwordMatch = passwordEncoder.matches(request.getPassword(), user.getPasswordHash());
        if (!passwordMatch) {
            return null;
        }

        // Bước 4: Kiểm tra tài khoản có bị khóa không
        if (!user.getIsActive()) {
            throw new AppException(MessageConstant.ACCOUNT_LOCKED);
        }

        return user;
    }

    /**
     * Flow: Kiểm tra email trùng -> Tạo User mới -> Gán Role CUSTOMER (ID=3) cố định -> Lưu DB.
     * BẢO MẬT: Bỏ qua roleID từ request, tránh user tự gửi RoleID=1 (Admin).
     */
    public User register(RegisterRequest request) {
        // Bước 1: Kiểm tra email đã tồn tại chưa
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(MessageConstant.EMAIL_ALREADY_EXISTS);
        }

        // Bước 2: Tạo đối tượng User mới
        User newUser = new User();
        newUser.setEmail(request.getEmail());
        newUser.setUsername(request.getUsername());
        newUser.setFullName(request.getFullName());

        // Bước 3: Mã hóa mật khẩu bằng Bcrypt trước khi lưu
        newUser.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        // Bước 4: Lấy Role CUSTOMER (ID = 3) - BỎ QUA roleID từ request (bảo mật)
        int roleId = RoleConstant.CUSTOMER;
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new AppException(MessageConstant.ROLE_NOT_FOUND));
        newUser.setRole(role);

        // Bước 5: Kích hoạt tài khoản mặc định
        newUser.setIsActive(true);

        return userRepository.save(newUser);
    }
}