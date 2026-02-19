package com.tallt.marketplace.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String email;
    private String password;
    private String fullName;
    private String username;
    private Integer roleID;
}
