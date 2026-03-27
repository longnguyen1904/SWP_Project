package com.tallt.marketplace.repository;

import com.tallt.marketplace.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Integer> {

    Optional<Coupon> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndVendor_VendorIDAndProduct_ProductID(String code, Integer vendorId, Integer productId);

    boolean existsByCodeIgnoreCaseAndVendor_VendorIDAndProductIsNull(String code, Integer vendorId);

    boolean existsByCodeIgnoreCaseAndVendor_VendorIDAndProductIsNotNull(String code, Integer vendorId);

    boolean existsByCodeIgnoreCaseAndVendor_VendorID(String code, Integer vendorId);

    List<Coupon> findByVendor_VendorID(Integer vendorId);
}
