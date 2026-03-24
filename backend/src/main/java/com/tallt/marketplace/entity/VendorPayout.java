package com.tallt.marketplace.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "VendorPayouts")
@Data
public class VendorPayout {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "PayoutID")
    private Integer payoutID;

    @ManyToOne
    @JoinColumn(name = "VendorID", nullable = false)
    private Vendor vendor;

    @Column(name = "Amount")
    private BigDecimal amount;

    @Column(name = "PlatformFee")
    private BigDecimal platformFee;

    @Column(name = "Tax")
    private BigDecimal tax;

    @Column(name = "NetAmount")
    private BigDecimal netAmount;

    @Column(name = "AdminNote")
    private String adminNote;

    @Column(name = "PayoutDate")
    private LocalDateTime payoutDate;

    @Column(name = "ProcessedAt")
    private LocalDateTime processedAt;

    @Column(name = "Status")
    private String status;

    @Column(name = "TransactionRef")
    private String transactionRef;

}
