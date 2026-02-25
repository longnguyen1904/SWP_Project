package com.tallt.marketplace.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "ProductImages")
@Data
public class ProductImage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ImageID")
    private Integer imageID;

    @ManyToOne
    @JoinColumn(name = "ProductID", nullable = false)
    private Product product;

    @Column(name = "ImageUrl", nullable = false)
    private String imageUrl;

    @Column(name = "ImageType")
    private String imageType = "SCREENSHOT";

    @Column(name = "SortOrder")
    private Integer sortOrder = 0;

    @Column(name = "IsPrimary")
    private Boolean isPrimary = false;

    @Column(name = "CreatedAt", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
