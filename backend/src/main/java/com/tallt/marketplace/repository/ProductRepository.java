package com.tallt.marketplace.repository;

import com.tallt.marketplace.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
public interface ProductRepository extends JpaRepository<Product, Integer> {

    Page<Product> findByStatus(String status, Pageable pageable);

    Page<Product> findByProductNameContainingIgnoreCase(String productName, Pageable pageable);

    Page<Product> findByStatusAndProductNameContainingIgnoreCase(
            String status,
            String productName,
            Pageable pageable
    );
}