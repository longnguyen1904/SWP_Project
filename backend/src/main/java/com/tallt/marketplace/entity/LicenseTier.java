package com.tallt.marketplace.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "LicenseTiers")
@Data
public class LicenseTier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "TierID")
    private Integer tierID;

    @ManyToOne
    @JoinColumn(name = "ProductID", nullable = false)
    private Product product;

    @Column(name = "TierName")
    private String tierName;

    @Column(name = "Price")
    private BigDecimal price;

    @Column(name = "MaxDevices")
    private Integer maxDevices;

    @Column(name = "DurationDays")
    private Integer durationDays;

    @Column(name = "Content", columnDefinition = "LONGTEXT")
    private String content;

    @Column(name = "TierCode")
    private String tierCode;
}
