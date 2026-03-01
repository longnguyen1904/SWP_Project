package com.tallt.marketplace.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.tallt.marketplace.dto.UpdateProfileRequest;
import com.tallt.marketplace.entity.User;
import com.tallt.marketplace.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
public void updateProfile(UpdateProfileRequest request) {

    User user = userRepository.findById(request.getUserId())
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "User not found"
                )
            );

    if (request.getFullName() != null && !request.getFullName().isBlank()) {
        user.setFullName(request.getFullName());
    }

    if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {

        if (request.getOldPassword() == null ||
            !passwordEncoder.matches(
                    request.getOldPassword(),
                    user.getPasswordHash())) {

            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Old password is incorrect"
            );
        }
        user.setPasswordHash(
                passwordEncoder.encode(request.getNewPassword()));
    }

    userRepository.save(user);
}

}
