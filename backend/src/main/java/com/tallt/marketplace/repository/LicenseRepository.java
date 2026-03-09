package com.tallt.marketplace.repository;

import com.tallt.marketplace.entity.License;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface LicenseRepository extends JpaRepository<License, Integer> {

    Optional<License> findByOrder_OrderID(Integer orderId);

    boolean existsByLicenseKey(String licenseKey);

    boolean existsByUser_UserIDAndProduct_ProductIDAndIsTrialTrueAndIsDeletedFalse(Integer userId, Integer productId);

    /** Kiểm tra user có License còn hiệu lực cho sản phẩm (ExpireAt > now AND IsActive = true). */
    boolean existsByUser_UserIDAndProduct_ProductIDAndIsActiveTrueAndExpireAtAfter(
            Integer userId, Integer productId, LocalDateTime now);
}
