package com.tallt.marketplace.dto.vendor;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * DTO Admin duyệt/từ chối Vendor
 */
@Data
public class VendorVerifyRequest {

    @NotNull(message = "Trạng thái duyệt không được để trống (APPROVED hoặc REJECTED)")
    private String status;

    private String note;
}
