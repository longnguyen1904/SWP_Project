package com.tallt.marketplace.entity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "Orders")
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

