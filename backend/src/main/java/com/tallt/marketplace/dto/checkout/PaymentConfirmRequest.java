package com.tallt.marketplace.dto.checkout;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PaymentConfirmRequest {

    @NotNull
    private Integer orderId;

    @NotBlank
    private String transactionRef;

    @NotBlank
    private String status;
}
