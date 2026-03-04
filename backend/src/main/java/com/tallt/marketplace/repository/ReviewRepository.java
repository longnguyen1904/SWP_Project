package com.tallt.marketplace.repository;

import com.tallt.marketplace.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Integer> {

    Page<Review> findByProduct_ProductID(Integer productId, Pageable pageable);

    long countByProduct_ProductID(Integer productId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.productID = :productId")
    Double getAverageRating(@Param("productId") Integer productId);
}
