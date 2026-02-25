package com.tallt.marketplace.repository;

import com.tallt.marketplace.entity.VendorPayout;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VendorPayoutRepository extends JpaRepository<VendorPayout, Integer> {

    Page<VendorPayout> findByVendor_VendorID(Integer vendorId, Pageable pageable);
}
