package com.tallt.marketplace.entity;

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
}
