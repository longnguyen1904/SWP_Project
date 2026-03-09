package com.tallt.marketplace.dto.vendor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * DTO đăng ký trở thành Vendor
 */
@Data
public class VendorRegisterRequest {

    @NotNull(message = "Loại vendor không được để trống (INDIVIDUAL hoặc COMPANY)")
    private String type;

    private String companyName;

    /** Mô tả doanh nghiệp / sản phẩm dự định bán (tùy chọn). */
    private String description;

    private String taxCode;

    @NotBlank(message = "Số CMND/CCCD không được để trống")
    private String citizenId;

    @NotBlank(message = "Link tài liệu xác thực không được để trống")
    private String identificationDoc;
}
