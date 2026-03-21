package com.tallt.marketplace.dto.product;

import lombok.Data;

@Data
public class LicenseVerifyRequest {
    private Integer orderID;

    private String fileUrl;
}
