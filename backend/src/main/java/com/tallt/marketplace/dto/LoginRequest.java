package com.tallt.marketplace.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Login request DTO with validation annotations.
 * Validation messages are returned to React in the ApiResponse result field.
 */
@Data
public class LoginRequest {
    @NotBlank(message = "Vui lòng nhập Username hoặc Email")
    private String identifier; // Dùng chung cho cả Email VÀ Username
    
    @NotBlank(message = "Password không được để trống")
    private String password;
}