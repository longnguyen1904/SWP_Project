package com.tallt.marketplace.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "Licenses")
@Data
public class License {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "LicenseID")
    private Integer licenseID;

    @Column(name = "LicenseKey", unique = true, nullable = false)
    private String licenseKey;

    @OneToOne
    @JoinColumn(name = "OrderID", nullable = false, unique = true)
    private Order order;

    @ManyToOne
    @JoinColumn(name = "UserID", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "ProductID", nullable = false)
    private Product product;

    @ManyToOne
    @JoinColumn(name = "TierID", nullable = false)
    private LicenseTier tier;

    @Column(name = "IsActive")
    private Boolean isActive = true;

    @Column(name = "IsTrial")
    private Boolean isTrial = false;

    @Column(name = "ExpireAt")
    private LocalDateTime expireAt;

    @Column(name = "CreatedAt", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "IsDeleted")
    private Boolean isDeleted = false;
}
