package com.tallt.marketplace.dto.vendor;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * DTO phản hồi sau khi đăng ký Vendor
 */
@Data
@AllArgsConstructor
public class VendorRegisterResponse {
    private Integer vendorId;
    private String status;
    private String message;
}
