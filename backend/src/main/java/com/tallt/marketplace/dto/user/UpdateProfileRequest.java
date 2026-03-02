package com.tallt.marketplace.dto.user;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO cập nhật thông tin cá nhân
 */
@Data
public class UpdateProfileRequest {

    @Size(max = 255, message = "Họ tên tối đa 255 ký tự")
    private String fullName;

    @Size(min = 6, message = "Mật khẩu phải có ít nhất 6 ký tự")
    private String password;
}
