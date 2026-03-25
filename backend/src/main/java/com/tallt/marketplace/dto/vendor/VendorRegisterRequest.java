package com.tallt.marketplace.dto.vendor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * DTO đăng ký trở thành Vendor
 */
@Data
public class VendorRegisterRequest {

    @NotNull(message = "Vendor type is required (INDIVIDUAL or COMPANY)")
    private String type;

    private String companyName;

    /** Business description / planned products (optional). */
    private String description;

    @NotBlank(message = "Tax code is required")
    @Pattern(regexp = "^\\d{10,13}$", message = "Tax code must be 10-13 digits")
    private String taxCode;

    @NotBlank(message = "Identification document URL is required")
    private String identificationDoc;
}
