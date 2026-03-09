package com.tallt.marketplace.dto.licensetier;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import lombok.Data;
import java.math.BigDecimal;

/**
 * DTO cập nhật License Tier
 */
@Data
public class UpdateLicenseTierRequest {

    private String tierName;

    @DecimalMin(value = "0.0", inclusive = false, message = "Giá phải lớn hơn 0")
    private BigDecimal price;

    @Min(value = 1, message = "Số thiết bị tối đa phải >= 1")
    private Integer maxDevices;

    @Min(value = 1, message = "Số ngày sử dụng phải >= 1")
    private Integer durationDays;

    private String content;

    private String tierCode;
}
