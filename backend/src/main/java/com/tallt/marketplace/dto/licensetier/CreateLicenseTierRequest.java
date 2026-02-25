package com.tallt.marketplace.dto.licensetier;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

/**
 * DTO tạo License Tier
 */
@Data
public class CreateLicenseTierRequest {

    @NotBlank(message = "Tên tier không được để trống")
    private String tierName;

    @NotNull(message = "Giá không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá phải lớn hơn 0")
    private BigDecimal price;

    @NotNull(message = "Số thiết bị tối đa không được để trống")
    @Min(value = 1, message = "Số thiết bị tối đa phải >= 1")
    private Integer maxDevices;

    @NotNull(message = "Số ngày sử dụng không được để trống")
    @Min(value = 1, message = "Số ngày sử dụng phải >= 1")
    private Integer durationDays;

    private String content;

    @NotBlank(message = "Mã tier không được để trống")
    private String tierCode;
}
