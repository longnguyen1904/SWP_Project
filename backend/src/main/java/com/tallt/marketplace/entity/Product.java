package com.tallt.marketplace.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "Products")
@Getter
@Setter
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ProductID")
    private Integer productID;

    @Column(name = "VendorID", nullable = false)
    private Integer vendorID;

    @Column(name = "CategoryID", nullable = false)
    private Integer categoryID;

    @Column(name = "ProductName", nullable = false)
    private String productName;

    @Lob
    @Column(name = "Description")
    private String description;

    @Column(name = "BasePrice")
    private BigDecimal basePrice;

    @Column(name = "Status", nullable = false)
    private String status = "DRAFT";

    @Lob
    @Column(name = "RejectionNote")
    private String rejectionNote;

    @Column(name = "CreatedAt", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "HasTrial")
    private Boolean hasTrial = false;

    @Column(name = "TrialDurationDays")
    private Integer trialDurationDays = 7;

    // ====== RELATION ======
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
    private List<ProductVersion> versions;
}