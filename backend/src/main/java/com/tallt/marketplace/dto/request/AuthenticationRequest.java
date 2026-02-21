package com.tallt.marketplace.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * DTO nhận yêu cầu xác thực (Authentication) để lấy Token.
 * TẠI SAO đặt tên AuthenticationRequest thay vì LoginRequest?
 * Theo Separation of Concerns: Controller Auth chỉ lo "cấp phát chìa khóa (Token)", không lo "tạo/sửa User".
 * Tên AuthenticationRequest thể hiện rõ đây là request để xác thực và nhận Token, không phải thao tác trên tài nguyên User.
 *
 * Đăng nhập bằng email: key nhận vào là "email" (không dùng username) để đồng bộ với User entity (findByEmail)
 * và JWT subject (subject = user.getEmail()). Frontend gửi { "email": "...", "password": "..." }.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AuthenticationRequest {

    @NotBlank(message = "Email không được để trống")
    String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    String password;
}
