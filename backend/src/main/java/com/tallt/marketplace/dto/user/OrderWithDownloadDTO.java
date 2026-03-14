package com.tallt.marketplace.dto.user;


import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.tallt.marketplace.entity.License;
import com.tallt.marketplace.entity.LicenseTier;
import com.tallt.marketplace.entity.Product;
import com.tallt.marketplace.entity.User;

import jakarta.persistence.Column;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class OrderWithDownloadDTO {

     private Integer orderID;
    private String fileUrl;
   

    private User user;

    private Product product;
    
    private License license;

    private LicenseTier tier;

    private Integer quantity = 1;

    private BigDecimal unitPrice;

    private BigDecimal discountAmount = BigDecimal.ZERO;

    private BigDecimal totalAmount;

    private String paymentMethod = "VNPay";

    private String paymentStatus = "Pending";

    private String transactionRef;

    private LocalDateTime createdAt = LocalDateTime.now();
}