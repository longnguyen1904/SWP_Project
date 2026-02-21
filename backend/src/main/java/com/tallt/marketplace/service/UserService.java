package com.tallt.marketplace.service;

import com.tallt.marketplace.constant.RoleConstant;
import com.tallt.marketplace.dto.request.UserCreationRequest;
import com.tallt.marketplace.dto.response.UserResponse;
import com.tallt.marketplace.entity.Role;
import com.tallt.marketplace.entity.User;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.exception.ErrorCode;
import com.tallt.marketplace.mapper.UserMapper;
import com.tallt.marketplace.repository.RoleRepository;
import com.tallt.marketplace.repository.UserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Service quản lý tài nguyên User: tạo, xem, sửa, xóa (CRUD).
 * Tách riêng khỏi AuthenticationService theo Separation of Concerns: UserService lo dữ liệu User,
 * AuthenticationService chỉ lo xác thực và cấp Token.
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserService {

    UserRepository userRepository;
    RoleRepository roleRepository;
    PasswordEncoder passwordEncoder;
    UserMapper userMapper;

    /**
     * Tạo User mới (Resource Create). Logic cũ của "register" chuyển sang đây.
     * Trả về UserResponse (thông tin User), không trả Token - client muốn Token thì gọi POST /auth/token.
     */
    public UserResponse createUser(UserCreationRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        int roleId = (request.getRoleID() != null) ? request.getRoleID() : RoleConstant.CUSTOMER;
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        User newUser = User.builder()
                .email(request.getEmail())
                .fullName(request.getFullName())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .username(request.getEmail().split("@")[0])
                .role(role)
                .isActive(true)
                .build();

        User savedUser = userRepository.save(newUser);
        return userMapper.toUserResponse(savedUser);
    }
}
