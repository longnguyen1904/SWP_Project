package com.tallt.marketplace.dto.wallet;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

/**
 * DTO yêu cầu rút tiền
 */
@Data
public class PayoutRequest {

    @NotNull(message = "Số tiền rút không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Số tiền rút phải lớn hơn 0")
    private BigDecimal amount;
}
