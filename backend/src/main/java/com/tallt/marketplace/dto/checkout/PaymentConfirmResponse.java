package com.tallt.marketplace.dto.checkout;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PaymentConfirmResponse {
    private Integer orderId;
    private String paymentStatus;
    private Integer licenseId;
    private String licenseKey;
    private LocalDateTime expireAt;
}
