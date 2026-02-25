package com.tallt.marketplace.dto.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.math.BigDecimal;

/**
 * DTO cập nhật thông tin sản phẩm
 */
@Data
public class UpdateProductRequest {

    @Size(max = 255, message = "Tên sản phẩm tối đa 255 ký tự")
    private String productName;

    private String description;

    @DecimalMin(value = "0.0", inclusive = false, message = "Giá phải lớn hơn 0")
    private BigDecimal basePrice;
}
