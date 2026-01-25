package com.tallt.marketplace.dto;

import com.tallt.marketplace.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for successful login.
 * Contains JWT token and user information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    /**
     * JWT token for authentication
     * Note: This will be populated when JWT implementation is added
     */
    private String token;
    
    /**
     * User information
     */
    private User user;
}
