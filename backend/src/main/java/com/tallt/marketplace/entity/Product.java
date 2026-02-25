package com.tallt.marketplace.entity;
<<<<<<< HEAD

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "Products")
@Data
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ProductID")
    private Integer productID;

    @ManyToOne
    @JoinColumn(name = "VendorID", nullable = false)
    private Vendor vendor;

    @ManyToOne
    @JoinColumn(name = "CategoryID", nullable = false)
    private Category category;

    @Column(name = "ProductName", nullable = false)
    private String productName;

    @Column(name = "Description", columnDefinition = "LONGTEXT")
    private String description;

    @Column(name = "BasePrice")
    private BigDecimal basePrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "Status", nullable = false)
    private ProductStatus status = ProductStatus.DRAFT;

    @Column(name = "RejectionNote")
    private String rejectionNote;

    @Column(name = "CreatedAt", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "HasTrial")
    private Boolean hasTrial = false;

    @Column(name = "TrialDurationDays")
    private Integer trialDurationDays = 7;

    public Boolean getIsApproved() {
        return this.status == ProductStatus.APPROVED;
    }

    public enum ProductStatus {
        DRAFT, PENDING, APPROVED, REJECTED
    }
=======
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "Products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer productID;

    private Integer vendorID;
    private String productName;
>>>>>>> a2a09c3a7a25716178ee1a006acc5464266ec17e
}
