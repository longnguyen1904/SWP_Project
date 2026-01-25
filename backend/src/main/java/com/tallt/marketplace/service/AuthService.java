package com.tallt.marketplace.service;

import com.tallt.marketplace.constant.RoleConstant;
import com.tallt.marketplace.dto.LoginRequest;
import com.tallt.marketplace.dto.LoginResponse;
import com.tallt.marketplace.dto.RegisterRequest;
import com.tallt.marketplace.entity.Role;
import com.tallt.marketplace.entity.User;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.exception.ErrorCode;
import com.tallt.marketplace.repository.RoleRepository;
import com.tallt.marketplace.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Authentication service with standardized error handling.
 * 
 * All errors are thrown as AppException with ErrorCode.
 * This ensures consistent error responses that React can easily handle.
 */
@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    /**
     * Authenticates a user and returns login response with JWT token and user info.
     * 
     * @param request Login request containing identifier (email/username) and password
     * @return LoginResponse containing JWT token and user information
     * @throws AppException with ErrorCode.USER_NOT_FOUND if user doesn't exist
     * @throws AppException with ErrorCode.INVALID_PASSWORD if password is incorrect
     * @throws AppException with ErrorCode.ACCOUNT_DISABLED if account is inactive
     */
    public LoginResponse login(LoginRequest request) {
        // Find user by email or username
        User user = userRepository.findByEmailOrUsername(
                request.getIdentifier(), 
                request.getIdentifier()
        );
        
        // Check if user exists
        if (user == null) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }
        
        // Check if account is active
        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new AppException(ErrorCode.ACCOUNT_DISABLED);
        }
        
        // Validate password
        if (!user.getPasswordHash().equals(request.getPassword())) {
            throw new AppException(ErrorCode.INVALID_PASSWORD);
        }
        
        // Build login response
        // TODO: Generate JWT token when JWT implementation is added
        String jwtToken = "jwt_token_placeholder"; // Replace with actual JWT generation
        
        return LoginResponse.builder()
                .token(jwtToken)
                .user(user)
                .build();
    }

    /**
     * Registers a new user in the system.
     * 
     * @param request Registration request containing user details
     * @return Created User entity
     * @throws AppException with ErrorCode.USER_EXISTED if email already exists
     * @throws AppException with ErrorCode.USERNAME_EXISTED if username already exists
     * @throws AppException with ErrorCode.ROLE_NOT_FOUND if role doesn't exist
     */
    public User register(RegisterRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }
        
        // Check if username already exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException(ErrorCode.USERNAME_EXISTED);
        }

        // Get or default role
        int roleId = (request.getRoleID() != null) ? request.getRoleID() : RoleConstant.CUSTOMER;
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        // Create new user
        User newUser = new User();
        newUser.setEmail(request.getEmail());
        newUser.setUsername(request.getUsername());
        newUser.setPasswordHash(request.getPassword());
        newUser.setFullName(request.getFullName());
        newUser.setRole(role);
        newUser.setIsActive(true);

        return userRepository.save(newUser);
    }
}