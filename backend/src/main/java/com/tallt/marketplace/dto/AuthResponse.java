package com.tallt.marketplace.dto;

import lombok.Data;

@Data
public class AuthResponse {
    private String email;
    private String fullName;
    private String roleName;
    private String token; 
    private Integer userID; 
    private String vendorStatus; 
    private String suspendReason; 

    public AuthResponse(String email, String fullName, String roleName, String token, Integer userID) {
        this.email = email;
        this.fullName = fullName;
        this.roleName = roleName;
        this.token = token;
        this.userID = userID;
    }

    public AuthResponse(String email, String fullName, String roleName, String token, Integer userID,
            String vendorStatus, String suspendReason) {
        this(email, fullName, roleName, token, userID);
        this.vendorStatus = vendorStatus;
        this.suspendReason = suspendReason;
    }
}