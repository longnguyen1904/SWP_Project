package com.tallt.marketplace.dto.product;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ProductImageResponse {
    private Integer imageId;
    private String imageUrl;
    private String imageType;
    private Integer sortOrder;
    private Boolean isPrimary;
    private LocalDateTime createdAt;
}
