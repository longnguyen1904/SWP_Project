package com.tallt.marketplace.repository;

import com.tallt.marketplace.entity.VendorFollower;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VendorFollowerRepository extends JpaRepository<VendorFollower, Integer> {

    boolean existsByUser_UserIDAndVendor_VendorID(Integer userId, Integer vendorId);

    Optional<VendorFollower> findByUser_UserIDAndVendor_VendorID(Integer userId, Integer vendorId);

    List<VendorFollower> findByVendor_VendorID(Integer vendorId);

    long countByVendor_VendorID(Integer vendorId);

    @Query("SELECT vf.user.email FROM VendorFollower vf WHERE vf.vendor.vendorID = :vendorId")
    List<String> findFollowerEmailsByVendorId(@Param("vendorId") Integer vendorId);

    List<VendorFollower> findByUser_UserID(Integer userId);
}
