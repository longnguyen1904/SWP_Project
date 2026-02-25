package com.tallt.marketplace.dto.trial;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TrialStartResponse {
    private Integer orderId;
    private Integer licenseId;
    private String licenseKey;
    private LocalDateTime expireAt;
}
