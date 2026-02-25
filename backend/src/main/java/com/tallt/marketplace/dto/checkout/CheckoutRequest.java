package com.tallt.marketplace.dto.checkout;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CheckoutRequest {

    @NotNull
    private Integer productId;

    @NotNull
    private Integer tierId;

    @Min(1)
    private Integer quantity = 1;
}
