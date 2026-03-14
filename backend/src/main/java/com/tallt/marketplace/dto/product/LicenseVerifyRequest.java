package com.tallt.marketplace.dto.product;

import lombok.Data;

@Data
public class LicenseVerifyRequest {
    private String licenseKey;
    private int productID ;
}
