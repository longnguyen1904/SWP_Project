package com.tallt.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AdminProductReviewDTO {

    private Integer productID;
    private String productName;
    private Integer vendorID;
    private Double basePrice;
    private String scanStatus;
    private String status;
    private String rejectionNote;
}