package com.tallt.marketplace.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * DTO nhận yêu cầu tạo mới một User (Resource-based).
 * TẠI SAO đặt tên UserCreationRequest thay vì RegisterRequest?
 * Theo RESTful, đăng ký bản chất là "Tạo tài nguyên User" (Create User). Tên theo tài nguyên (User)
 * và hành động (Creation) giúp URL rõ ràng: POST /users = tạo user mới, không nhầm với "auth".
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserCreationRequest {

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, message = "Mật khẩu phải có ít nhất 6 ký tự")
    String password;

    @NotBlank(message = "Họ tên không được để trống")
    String fullName;

    /** Client có thể gửi; Backend bỏ qua và luôn gán Role CUSTOMER (bảo mật). */
    Integer roleID;
}
