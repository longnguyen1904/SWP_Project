package com.tallt.marketplace.dto.product;

import com.tallt.marketplace.dto.licensetier.LicenseTierResponse;
import lombok.Data;

import java.util.List;

@Data
public class ProductDetailResponse {
    private ProductResponse product;
    private List<ProductImageResponse> images;
    private ProductVersionResponse latestVersion;
    private List<LicenseTierResponse> licenseTiers;
    private Double averageRating;
    private Long reviewCount;
    private List<ProductResponse> relatedProducts;
}
