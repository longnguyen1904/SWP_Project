package com.tallt.marketplace.dto.wallet;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

/**
 * DTO phản hồi thông tin ví Vendor
 */
@Data
public class WalletResponse {
    private BigDecimal balance;
    private List<WalletTransactionResponse> transactions;
}
