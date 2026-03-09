package com.tallt.marketplace.dto.checkout;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request body khi Customer bấm "Xác nhận mua hàng".
 */
@Data
public class CheckoutRequest {

    @NotNull(message = "productId is required")
    private Integer productId;

    @NotNull(message = "tierId is required")
    private Integer tierId;
}
