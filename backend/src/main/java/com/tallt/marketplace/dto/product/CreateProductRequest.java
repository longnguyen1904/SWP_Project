package com.tallt.marketplace.dto.product;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

/**
 * DTO tạo sản phẩm mới
 */
@Data
public class CreateProductRequest {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(max = 255, message = "Tên sản phẩm tối đa 255 ký tự")
    private String productName;

    @NotNull(message = "Danh mục không được để trống")
    private Integer categoryId;

    private String description;

    @NotNull(message = "Giá cơ bản không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá phải lớn hơn 0")
    private BigDecimal basePrice;

    private Boolean hasTrial = false;

    private Integer trialDurationDays = 7;

    private List<String> tags;
}
