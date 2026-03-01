package com.tallt.marketplace.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ProductDTO {
    private String productName;
    private String description;
    private BigDecimal basePrice;
}
