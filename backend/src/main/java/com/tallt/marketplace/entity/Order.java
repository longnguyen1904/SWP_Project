package com.tallt.marketplace.entity;
<<<<<<< HEAD

import jakarta.persistence.*;
import lombok.Data;

=======
import jakarta.persistence.*;
>>>>>>> a2a09c3a7a25716178ee1a006acc5464266ec17e
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "Orders")
<<<<<<< HEAD
@Data
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "OrderID")
    private Integer orderID;

    @ManyToOne
    @JoinColumn(name = "UserID", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "ProductID", nullable = false)
    private Product product;

    @ManyToOne
    @JoinColumn(name = "TierID", nullable = false)
    private LicenseTier tier;

    @Column(name = "Quantity")
    private Integer quantity = 1;

    @Column(name = "UnitPrice", nullable = false)
    private BigDecimal unitPrice;

    @Column(name = "DiscountAmount")
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "TotalAmount", nullable = false)
    private BigDecimal totalAmount;

    @Column(name = "PaymentMethod")
    private String paymentMethod = "VNPay";

    @Column(name = "PaymentStatus")
    private String paymentStatus = "Pending";

    @Column(name = "TransactionRef")
    private String transactionRef;

    @Column(name = "CreatedAt", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
=======
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer orderID;

    private BigDecimal totalAmount;
    private String paymentStatus;
    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "ProductID")
    private Product product;
}

>>>>>>> a2a09c3a7a25716178ee1a006acc5464266ec17e
