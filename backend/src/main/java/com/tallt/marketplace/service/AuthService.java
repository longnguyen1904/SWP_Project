package com.tallt.marketplace.service;

import com.tallt.marketplace.dto.LoginRequest;
import com.tallt.marketplace.dto.RegisterRequest;
import com.tallt.marketplace.entity.Role;
import com.tallt.marketplace.entity.User;
import com.tallt.marketplace.repository.RoleRepository;
import com.tallt.marketplace.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    // --- CHỨC NĂNG ĐĂNG NHẬP ---
    public User login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail());

        // So sánh password (thực tế nên dùng BCrypt)
        if (user != null && user.getPasswordHash().equals(request.getPassword())) {
            return user;
        }
        return null;
    }

    // --- CHỨC NĂNG ĐĂNG KÝ ---
    public User register(RegisterRequest request) {
        // 1. Kiểm tra email trùng
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email này đã được sử dụng!");
        }

        // 2. Lấy Role từ database (Mặc định là Customer nếu không gửi lên)
        int roleId = (request.getRoleID() != null) ? request.getRoleID() : 3; // 3: Customer
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role không tồn tại!"));

        // 3. Tạo User mới
        User newUser = new User();
        newUser.setEmail(request.getEmail());
        newUser.setPasswordHash(request.getPassword()); // Lưu ý: Nên mã hóa ở đây
        newUser.setFullName(request.getFullName());
        newUser.setRole(role);
        newUser.setIsActive(true);

        return userRepository.save(newUser);
    }
}