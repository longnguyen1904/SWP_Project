package com.tallt.marketplace.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "Users")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "UserID")
    private Integer userID;

    @Column(name = "Email", unique = true, nullable = false)
    private String email;

    @Column(name = "PasswordHash", nullable = false)
    private String passwordHash;

    @Column(name = "FullName")
    private String fullName;

    @ManyToOne
    @JoinColumn(name = "RoleID", nullable = false)
    private Role role;

    @Column(name = "Username", unique = true, nullable = false)
    private String username;

    @Column(name = "IsActive")
    private Boolean isActive = true;

    @Column(name = "Otp")
    private String otp;

    @Column(name = "OtpExpiry")
    private LocalDateTime otpExpiry;

    @Column(name = "OtpAttempts")
    private Integer otpAttempts = 0;

    @Column(name = "FailedLoginAttempts")
    private Integer failedLoginAttempts = 0;

    @Column(name = "LockoutUntil")
    private LocalDateTime lockoutUntil;

    @Column(name = "CreatedAt", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}