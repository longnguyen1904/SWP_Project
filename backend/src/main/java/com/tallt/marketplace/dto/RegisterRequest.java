package com.tallt.marketplace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "Email không được để trống")
    private String email;

    @NotBlank(message = "Username không được để trống")
    @Size(min = 3, message = "Username phải từ 3 ký tự trở lên")
    private String username; // <--- THÊM DÒNG NÀY

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, message = "Mật khẩu phải từ 6 ký tự trở lên")
    private String password;

    @NotBlank(message = "Họ tên không được để trống")
    private String fullName;

    private Integer roleID;
}