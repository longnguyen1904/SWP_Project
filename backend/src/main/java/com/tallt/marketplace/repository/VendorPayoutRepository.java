package com.tallt.marketplace.repository;

import com.tallt.marketplace.entity.VendorPayout;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface VendorPayoutRepository extends JpaRepository<VendorPayout, Integer> {

    Page<VendorPayout> findByVendor_VendorID(Integer vendorId, Pageable pageable);

    Page<VendorPayout> findByStatus(String status, Pageable pageable);

    List<VendorPayout> findByVendor_VendorIDAndStatus(Integer vendorId, String status);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM VendorPayout p WHERE p.vendor.vendorID = :vendorId AND p.status = :status")
    BigDecimal sumAmountByVendorAndStatus(@Param("vendorId") Integer vendorId, @Param("status") String status);
}

