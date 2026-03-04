package com.tallt.marketplace.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "ProductTags")
@Data
@IdClass(ProductTagId.class)
public class ProductTag {
    @Id
    @Column(name = "ProductID")
    private Integer productID;

    @Id
    @Column(name = "TagID")
    private Integer tagID;

    @ManyToOne
    @JoinColumn(name = "ProductID", insertable = false, updatable = false)
    private Product product;

    @ManyToOne
    @JoinColumn(name = "TagID", insertable = false, updatable = false)
    private Tag tag;
}
