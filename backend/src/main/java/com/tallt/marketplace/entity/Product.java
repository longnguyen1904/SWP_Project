    package com.tallt.marketplace.entity;

    import jakarta.persistence.*;
    import lombok.Getter;
    import lombok.Setter;

    import java.math.BigDecimal;
    import java.time.LocalDateTime;
    import java.util.List;

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

        @Column(name = "IsApproved")
        private Boolean isApproved = false;

        @Column(name = "CreatedAt")
        private LocalDateTime createdAt;

        @Column(name = "HasTrial")
        private Boolean hasTrial = false;

        @Column(name = "TrialDurationDays")
        private Integer trialDurationDays = 7;

        @OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
        private List<ProductVersion> versions;
    }