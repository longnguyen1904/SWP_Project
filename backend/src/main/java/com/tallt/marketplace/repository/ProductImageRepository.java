package com.tallt.marketplace.repository;

import com.tallt.marketplace.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, Integer> {

    List<ProductImage> findByProduct_ProductIDOrderBySortOrderAsc(Integer productId);
}
