package com.tallt.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String email;
    private String fullName;
    private String roleName;
    private String token; // Sau này dùng JWT thì nhét vào đây
}