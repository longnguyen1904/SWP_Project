package com.tallt.marketplace.dto.vendor;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class VendorShopResponse {
    private Integer vendorId;
    private String displayName;
    private String companyName;
    private String type;
    private Boolean isVerified;
    private LocalDateTime createdAt;
}
