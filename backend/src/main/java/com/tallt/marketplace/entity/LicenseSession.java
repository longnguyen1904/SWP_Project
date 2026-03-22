package com.tallt.marketplace.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "LicenseSessions")
@Data
public class LicenseSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "SessionID")
    private Integer sessionID;

    @ManyToOne
    @JoinColumn(name = "LicenseID", nullable = false)
    private License license;

    @Column(name = "DeviceIdentifier", nullable = false)
    private String deviceIdentifier;

    @Column(name = "DeviceName")
    private String deviceName;

    @Column(name = "IPAddress", length = 45)
    private String ipAddress;

    @Column(name = "LoginTime", updatable = false)
    private LocalDateTime loginTime = LocalDateTime.now();

    @Column(name = "LastActive")
    private LocalDateTime lastActive = LocalDateTime.now();

    @Column(name = "IsActive")
    private Boolean isActive = true;
}
