package com.tallt.marketplace.repository;

import com.tallt.marketplace.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, Integer> {

    List<ProductImage> findByProduct_ProductIDOrderBySortOrderAsc(Integer productId);

    Optional<ProductImage> findTopByProduct_ProductIDOrderBySortOrderAsc(Integer productId);

    void deleteByProduct_ProductID(Integer productId);
}
