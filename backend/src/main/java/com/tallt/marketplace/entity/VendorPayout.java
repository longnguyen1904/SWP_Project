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

    @Column(name = "PayoutDate")
    private LocalDateTime payoutDate;

    @Column(name = "Status")
    private String status;
}
