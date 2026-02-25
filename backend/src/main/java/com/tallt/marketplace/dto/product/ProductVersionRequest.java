package com.tallt.marketplace.dto.product;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO tạo phiên bản sản phẩm
 */
@Data
public class ProductVersionRequest {

    @NotBlank(message = "Số phiên bản không được để trống")
    private String versionNumber;

    @NotBlank(message = "URL file không được để trống")
    private String fileUrl;

    private String releaseNotes;
}
