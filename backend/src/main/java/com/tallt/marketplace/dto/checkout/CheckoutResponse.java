package com.tallt.marketplace.dto.checkout;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class CheckoutResponse {
    private Integer orderId;
    private String paymentMethod;
    private String paymentStatus;
    private String transactionRef;
    private BigDecimal totalAmount;
    private String paymentUrl;
}
