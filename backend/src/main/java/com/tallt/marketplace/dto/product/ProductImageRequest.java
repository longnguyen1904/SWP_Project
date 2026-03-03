package com.tallt.marketplace.dto.product;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO upload ảnh sản phẩm
 */
@Data
public class ProductImageRequest {

    @NotBlank(message = "URL ảnh không được để trống")
    private String imageUrl;

    private Boolean isPrimary = false;

    private Integer sortOrder = 0;

    private String imageType = "SCREENSHOT";
}
