package com.tallt.marketplace.dto.wallet;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO phản hồi giao dịch ví
 */
@Data
public class WalletTransactionResponse {
    private String type;
    private BigDecimal amount;
    private LocalDateTime createdAt;
    private String description;
}
