package com.tallt.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WishlistItemResponse {
    private Integer wishlistId;
    private WishlistProduct product;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class WishlistProduct {
        private Integer productId;
        private String productName;
        private BigDecimal basePrice;
        private String categoryName;
        private String imageUrl;
        private List<String> tags;
        private Double averageRating;
        private Long reviewCount;
        private Long soldCount;
    }
}
