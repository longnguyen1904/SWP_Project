package com.tallt.marketplace.repository;

import com.tallt.marketplace.entity.LicenseTier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LicenseTierRepository extends JpaRepository<LicenseTier, Integer> {

    Page<LicenseTier> findByProduct_ProductID(Integer productId, Pageable pageable);

    long countByProduct_ProductID(Integer productId);

    Optional<LicenseTier> findTopByProduct_ProductIDOrderByTierIDAsc(Integer productId);
}
