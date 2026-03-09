package com.tallt.marketplace.dto.licensetier;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateTicketRequest {

    private Integer vendorId;
    private Integer orderId;   // có thể null
    private String subject;
    private String description;
    private String priority;
private String attachmentName; // (Hoặc xử lý file upload thật qua MultipartFile)
}