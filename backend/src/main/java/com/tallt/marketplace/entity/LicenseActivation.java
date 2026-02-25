package com.tallt.marketplace.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "LicenseActivations")
@Data
public class LicenseActivation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ActivationID")
    private Integer activationID;

    @ManyToOne
    @JoinColumn(name = "LicenseID", nullable = false)
    private License license;

    @Column(name = "DeviceIdentifier")
    private String deviceIdentifier;

    @Column(name = "DeviceName")
    private String deviceName;

    @Column(name = "IPAddress")
    private String ipAddress;

    @Column(name = "ActivatedAt", updatable = false)
    private LocalDateTime activatedAt = LocalDateTime.now();
}
