package com.tallt.marketplace.repository;

import com.tallt.marketplace.entity.Vendor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VendorRepository extends JpaRepository<Vendor, Integer> {

    Optional<Vendor> findByUser_UserID(Integer userId);

    boolean existsByUser_UserID(Integer userId);

    /**
     * Tìm kiếm Vendor với filter, search, paging
     */
    @Query("SELECT v FROM Vendor v WHERE " +
            "(:search IS NULL OR v.companyName LIKE %:search% OR v.user.fullName LIKE %:search% OR v.user.email LIKE %:search%) " +
            "AND (:status IS NULL OR v.status = :status) " +
            "AND (:type IS NULL OR v.type = :type)")
    Page<Vendor> findAllWithFilters(
            @Param("search") String search,
            @Param("status") Vendor.VendorStatus status,
            @Param("type") Vendor.VendorType type,
            Pageable pageable
    );
}
