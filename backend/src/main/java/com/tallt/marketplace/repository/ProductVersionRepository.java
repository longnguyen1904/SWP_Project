package com.tallt.marketplace.repository;

import com.tallt.marketplace.entity.ProductVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductVersionRepository extends JpaRepository<ProductVersion, Integer> {

    // Lấy tất cả version của 1 product
    List<ProductVersion> findByProduct_ProductID(Integer productID);

    // Lấy version theo scan status
    List<ProductVersion> findByScanStatus(String scanStatus);
}