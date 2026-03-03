package com.tallt.marketplace.repository;

import com.tallt.marketplace.entity.ProductTag;
import com.tallt.marketplace.entity.ProductTagId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductTagRepository extends JpaRepository<ProductTag, ProductTagId> {

    List<ProductTag> findByProductID(Integer productId);

    @Query("SELECT pt.tagID FROM ProductTag pt WHERE pt.productID = :productId")
    List<Integer> findTagIdsByProductId(@Param("productId") Integer productId);

    void deleteByProductID(Integer productId);
}
