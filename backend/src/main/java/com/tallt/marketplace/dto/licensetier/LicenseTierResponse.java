package com.tallt.marketplace.dto.licensetier;

import lombok.Data;
import java.math.BigDecimal;

/**
 * DTO phản hồi thông tin License Tier
 */
@Data
public class LicenseTierResponse {
    private Integer tierId;
    private Integer productId;
    private String tierName;
    private BigDecimal price;
    private Integer maxDevices;
    private Integer durationDays;
    private String content;
    private String tierCode;
}
