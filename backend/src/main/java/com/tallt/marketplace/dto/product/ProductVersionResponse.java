package com.tallt.marketplace.dto.product;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * DTO phản hồi thông tin phiên bản sản phẩm
 */
@Data
public class ProductVersionResponse {
    private Integer versionId;
    private Integer productId;
    private String versionNumber;
    private String fileUrl;
    private String releaseNotes;
    private LocalDateTime createdAt;
}
