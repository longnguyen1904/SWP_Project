package com.tallt.marketplace.repository;

import com.tallt.marketplace.entity.Product;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {

    /**
     * Lấy danh sách sản phẩm của Vendor với filter, search, paging
     */
    @Query("SELECT p FROM Product p WHERE p.vendor.vendorID = :vendorId " +
            "AND (:search IS NULL OR p.productName LIKE %:search% OR p.description LIKE %:search%) " +
            "AND (:categoryId IS NULL OR p.category.categoryID = :categoryId) " +
            "AND (:status IS NULL OR p.status = :status)")
    Page<Product> findByVendorWithFilters(
            @Param("vendorId") Integer vendorId,
            @Param("search") String search,
            @Param("categoryId") Integer categoryId,
            @Param("status") Product.ProductStatus status,
            Pageable pageable
    );

    /**
     * Lấy tất cả sản phẩm (Admin) với filter, search, paging
     */
    @Query("SELECT p FROM Product p WHERE " +
            "(:search IS NULL OR p.productName LIKE %:search% OR p.description LIKE %:search%) " +
            "AND (:categoryId IS NULL OR p.category.categoryID = :categoryId) " +
            "AND (:status IS NULL OR p.status = :status) " +
            "AND (:vendorId IS NULL OR p.vendor.vendorID = :vendorId)")
    Page<Product> findAllWithFilters(
            @Param("search") String search,
            @Param("categoryId") Integer categoryId,
            @Param("status") Product.ProductStatus status,
            @Param("vendorId") Integer vendorId,
            Pageable pageable
    );

    /**
     * UC11 - Marketplace Storefront: danh sách sản phẩm public (chỉ IsApproved=true)
     * Hỗ trợ search/filter/paging/sort.
     */
    @Query("SELECT DISTINCT p FROM Product p " +
            "LEFT JOIN ProductTag pt ON pt.productID = p.productID " +
            "LEFT JOIN Tag t ON t.tagID = pt.tagID " +
            "WHERE p.status = 'APPROVED' " +
            "AND (:search IS NULL OR p.productName LIKE %:search% OR p.description LIKE %:search%) " +
            "AND (:categoryId IS NULL OR p.category.categoryID = :categoryId) " +
            "AND (:hasTrial IS NULL OR p.hasTrial = :hasTrial) " +
            "AND (:minPrice IS NULL OR p.basePrice >= :minPrice) " +
            "AND (:maxPrice IS NULL OR p.basePrice <= :maxPrice) " +
            "AND (:tag IS NULL OR t.tagName = :tag)")
    Page<Product> findApprovedStorefront(
            @Param("search") String search,
            @Param("categoryId") Integer categoryId,
            @Param("hasTrial") Boolean hasTrial,
            @Param("minPrice") java.math.BigDecimal minPrice,
            @Param("maxPrice") java.math.BigDecimal maxPrice,
            @Param("tag") String tag,
            Pageable pageable
    );

    /**
     * UC12 - Related products: cùng category, đã approved, loại trừ chính nó.
     */
    @Query("SELECT p FROM Product p WHERE p.status = 'APPROVED' " +
            "AND p.category.categoryID = :categoryId " +
            "AND p.productID <> :productId")
    Page<Product> findRelatedApproved(
            @Param("categoryId") Integer categoryId,
            @Param("productId") Integer productId,
            Pageable pageable
    );

    /**
     * UC12 - Related products theo tag trùng + cùng category.
     * Sắp xếp: số tag trùng giảm dần -> rating trung bình giảm dần -> createdAt giảm dần.
     *
     * Return Object[]:
     * - [0] Product
     * - [1] Long matchCount
     * - [2] Double avgRating
     */
    @Query("SELECT p, COUNT(DISTINCT t.tagID) AS matchCount, " +
            "COALESCE((SELECT AVG(r.rating) FROM Review r WHERE r.product.productID = p.productID), 0) AS avgRating " +
            "FROM Product p " +
            "JOIN ProductTag pt ON pt.productID = p.productID " +
            "JOIN Tag t ON t.tagID = pt.tagID " +
            "WHERE p.status = 'APPROVED' " +
            "AND p.category.categoryID = :categoryId " +
            "AND p.productID <> :productId " +
            "AND t.tagID IN :tagIds " +
            "GROUP BY p " +
            "ORDER BY matchCount DESC, avgRating DESC, p.createdAt DESC")
    Page<Object[]> findRelatedApprovedByTags(
            @Param("categoryId") Integer categoryId,
            @Param("productId") Integer productId,
            @Param("tagIds") List<Integer> tagIds,
            Pageable pageable
    );

    @Query("SELECT DISTINCT p FROM Product p " +
            "LEFT JOIN ProductTag pt ON pt.productID = p.productID " +
            "LEFT JOIN Tag t ON t.tagID = pt.tagID " +
            "WHERE p.status = 'APPROVED' " +
            "AND p.vendor.vendorID = :vendorId " +
            "AND (:search IS NULL OR p.productName LIKE %:search% OR p.description LIKE %:search%) " +
            "AND (:categoryId IS NULL OR p.category.categoryID = :categoryId) " +
            "AND (:hasTrial IS NULL OR p.hasTrial = :hasTrial) " +
            "AND (:minPrice IS NULL OR p.basePrice >= :minPrice) " +
            "AND (:maxPrice IS NULL OR p.basePrice <= :maxPrice) " +
            "AND (:tag IS NULL OR t.tagName = :tag)")
    Page<Product> findApprovedByVendorStorefront(
            @Param("vendorId") Integer vendorId,
            @Param("search") String search,
            @Param("categoryId") Integer categoryId,
            @Param("hasTrial") Boolean hasTrial,
            @Param("minPrice") java.math.BigDecimal minPrice,
            @Param("maxPrice") java.math.BigDecimal maxPrice,
            @Param("tag") String tag,
            Pageable pageable
    );
}
