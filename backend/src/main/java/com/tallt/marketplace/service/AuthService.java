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
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    // login
    public User login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail());
        if (user != null && user.getPasswordHash().equals(request.getPassword())) {
            return user;
        }
        return null;
    }

    // register
    public User register(RegisterRequest request) {
        // 1. Kiểm tra email trùng
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(MessageConstant.EMAIL_ALREADY_EXISTS);
        }

        // 2. Lấy Role
        int roleId = (request.getRoleID() != null) ? request.getRoleID() : RoleConstant.CUSTOMER;

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new AppException(MessageConstant.ROLE_NOT_FOUND));

        // 3. Tạo User
        User newUser = new User();
        newUser.setEmail(request.getEmail());
        newUser.setPasswordHash(request.getPassword());
        newUser.setFullName(request.getFullName());
        newUser.setRole(role);
        newUser.setIsActive(true);

        return userRepository.save(newUser);
    }
}