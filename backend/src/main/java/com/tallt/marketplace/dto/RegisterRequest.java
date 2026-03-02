package com.tallt.marketplace.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String email;
    private String password;
    private String fullName;
    private Integer roleID; // Frontend gửi lên: 2 là Vendor, 3 là Customer
}