package com.tallt.marketplace.dto;

import lombok.Data;

@Data
public class LoginRequest {
    // Chứa cả Email hoặc Username người dùng nhập vào
    private String identifier;
    private String password;
}