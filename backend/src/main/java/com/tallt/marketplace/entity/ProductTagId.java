package com.tallt.marketplace.entity;

import lombok.Data;
import java.io.Serializable;

@Data
public class ProductTagId implements Serializable {
    private Integer productID;
    private Integer tagID;
}
