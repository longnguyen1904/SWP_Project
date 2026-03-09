package com.tallt.marketplace.dto.product;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class PurchasedProductDTO {
    private Integer productId;
    private String productName;
    private Integer vendorId;
    private String vendorName;
    private Integer orderId;
    private String paymentStatus;
    private LocalDateTime purchaseDate;
    private String productImage; // may be null or placeholder
    private String licenseKey; // not currently used
}
