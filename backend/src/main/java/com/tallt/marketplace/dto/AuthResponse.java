package com.tallt.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO trả về sau khi Login/Register thành công.
 * - accessToken: JWT dùng cho các request sau (chỉ có khi Login).
 * - Register trả về accessToken = null (user cần đăng nhập lại).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private Integer userID;
    private String email;
    private String fullName;
    private String roleName;
    private String accessToken; // JWT Token - Frontend lưu với key "accessToken"
}