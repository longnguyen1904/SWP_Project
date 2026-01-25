package com.tallt.marketplace.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * Register request DTO with validation annotations.
 * Validation messages are returned to React in the ApiResponse result field.
 */
@Data
public class RegisterRequest {
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;
    
    @NotBlank(message = "Password không được để trống")
    @Size(min = 6, message = "Password phải có ít nhất 6 ký tự")
    private String password;
    
    @NotBlank(message = "Họ tên không được để trống")
    private String fullName;
    
    @NotBlank(message = "Username không được để trống")
    @Pattern(regexp = "^[a-zA-Z0-9._-]{3,}$", message = "Username không được chứa ký tự đặc biệt và dấu cách")
    private String username;
    
    private Integer roleID;
}