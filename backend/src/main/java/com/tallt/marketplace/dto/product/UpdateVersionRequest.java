package com.tallt.marketplace.dto.product;

import lombok.Data;

/**
 * DTO cập nhật phiên bản sản phẩm
 */
@Data
public class UpdateVersionRequest {

    private String versionNumber;

    private String fileUrl;

    private String releaseNotes;
}
