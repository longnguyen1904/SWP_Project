package com.tallt.marketplace.dto.user;


import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class OrderWithDownloadDTO {

     private Integer orderID;
    private String fileUrl;
}