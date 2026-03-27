package com.tallt.marketplace.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$",
        message = "Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 digit"
    )
    private String password;

    @NotBlank(message = "Họ tên không được để trống")
    private String fullName;

    private Integer roleID;

    public String getUsername() {
        return null; // Placeholder implementation, adjust as needed
    }
}
