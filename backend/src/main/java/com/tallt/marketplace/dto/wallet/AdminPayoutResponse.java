package com.tallt.marketplace.dto.wallet;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class AdminPayoutResponse {

    private Integer payoutId;
    private Integer vendorId;
    private String vendorName;
    private BigDecimal amount;
    private BigDecimal platformCommission;
    private BigDecimal tax;
    private BigDecimal vendorReceive;
    private String adminNote;
    private String status;
    private LocalDateTime payoutDate;
    private LocalDateTime processedAt;
}
