package com.tallt.marketplace.dto.product;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO phản hồi thông tin sản phẩm
 */
@Data
public class ProductResponse {
    private Integer productId;
    private String productName;
    private String categoryName;
    private Integer categoryId;
    private String description;
    private BigDecimal basePrice;
    private Boolean isApproved;
    private Boolean hasTrial;
    private Integer trialDurationDays;
    private String vendorName;
    private Integer vendorId;
    private LocalDateTime createdAt;
    private List<String> tags;
    private String status;
}
