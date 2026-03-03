package com.tallt.marketplace.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateTicketRequest {

    private Integer vendorId;
    private Integer orderId;   // có thể null
    private String subject;
    private String description;
}