package com.tallt.marketplace.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private Integer userId;        // test trước, sau này lấy từ JWT
    private String fullName;

    private String oldPassword;
    private String newPassword;
}
