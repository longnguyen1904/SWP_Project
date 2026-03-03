package com.tallt.marketplace.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "WalletTransactions")
@Data
public class WalletTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "TransactionID")
    private Integer transactionID;

    @ManyToOne
    @JoinColumn(name = "WalletID", nullable = false)
    private Wallet wallet;

    @Column(name = "Amount", nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "Type", nullable = false)
    private TransactionType type;

    @Column(name = "ReferenceID")
    private Integer referenceID;

    @Column(name = "Description")
    private String description;

    @Column(name = "CreatedAt", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum TransactionType {
        DEPOSIT, WITHDRAWAL, SALE_REVENUE, COMMISSION_FEE
    }
}
