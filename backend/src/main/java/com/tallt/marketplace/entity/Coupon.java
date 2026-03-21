package com.tallt.marketplace.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "Coupons")
@Data
public class Coupon {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "CouponID")
    private Integer couponId;

    @Column(name = "Code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "DiscountPercent", nullable = false)
    private Integer discountPercent;

    @Column(name = "MaxUses")
    private Integer maxUses;

    @Column(name = "CurrentUses")
    private Integer currentUses = 0;

    @Column(name = "ExpiresAt")
    private LocalDateTime expiresAt;

    @ManyToOne
    @JoinColumn(name = "VendorID", nullable = false)
    private Vendor vendor;

    @ManyToOne
    @JoinColumn(name = "ProductID")
    private Product product;

    @Column(name = "IsActive")
    private Boolean isActive = true;

    @Column(name = "CreatedAt", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
