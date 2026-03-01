package com.tallt.marketplace.repository;

import com.tallt.marketplace.entity.Vendor;
import com.tallt.marketplace.entity.Vendor.VendorStatus;
import com.tallt.marketplace.entity.Vendor.VendorType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VendorRepository extends JpaRepository<Vendor, Integer> {

    Page<Vendor> findByStatus(VendorStatus status, Pageable pageable);

    Page<Vendor> findByType(VendorType type, Pageable pageable);

    Page<Vendor> findByStatusAndType(VendorStatus status,
                                     VendorType type,
                                     Pageable pageable);
}