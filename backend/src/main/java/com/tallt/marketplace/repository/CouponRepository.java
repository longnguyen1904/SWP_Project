package com.tallt.marketplace.repository;

import com.tallt.marketplace.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Integer> {

    Optional<Coupon> findByCodeIgnoreCase(String code);

    List<Coupon> findByVendor_VendorID(Integer vendorId);
}
