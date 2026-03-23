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
    private BigDecimal available;
    private List<WalletTransactionResponse> transactions;
    private int page;
    private int size;
    private int totalPages;
    private long totalElements;
}
