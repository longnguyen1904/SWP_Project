package com.tallt.marketplace.controller;

import com.tallt.marketplace.dto.ApiResponse;
import com.tallt.marketplace.dto.PageResponse;
import com.tallt.marketplace.dto.product.ProductDetailResponse;
import com.tallt.marketplace.dto.product.ProductResponse;
import com.tallt.marketplace.dto.product.ProductVersionResponse;
import com.tallt.marketplace.dto.review.ReviewResponse;
import com.tallt.marketplace.service.ProductService;
import com.tallt.marketplace.service.ProductVersionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

/**
 * Controller public cho sản phẩm
 * - Lấy phiên bản mới nhất
 */
@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductVersionService productVersionService;

    @Autowired
    private ProductService productService;

    /**
     * UC11 - Marketplace Storefront
     * GET /api/products
     * - Chỉ trả về sản phẩm đã được duyệt (IsApproved=true)
     * - search/filter/paging/sort
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> getStorefrontProducts(
            @RequestParam(required = false, name = "q") String search,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) Boolean hasTrial,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String tag,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        PageResponse<ProductResponse> result = productService.getStorefrontProducts(
                search, categoryId, hasTrial, minPrice, maxPrice, tag, page, size, sortBy, sortDir
        );
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * UC12 - Product Detail Page
     * GET /api/products/{productId}
     */
    @GetMapping("/{productId}")
    public ResponseEntity<ApiResponse<ProductDetailResponse>> getProductDetail(
            @PathVariable Integer productId,
            @RequestParam(defaultValue = "6") int relatedSize) {
        ProductDetailResponse result = productService.getPublicProductDetail(productId, relatedSize);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * UC12 - Reviews list (paging)
     * GET /api/products/{productId}/reviews
     */
    @GetMapping("/{productId}/reviews")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> getProductReviews(
            @PathVariable Integer productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        PageResponse<ReviewResponse> result = productService.getProductReviews(productId, page, size, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Lấy phiên bản mới nhất của sản phẩm
     * GET /api/products/{productId}/versions/latest
     * - Order by CreatedAt DESC, return 1 record
     */
    @GetMapping("/{productId}/versions/latest")
    public ResponseEntity<ApiResponse<ProductVersionResponse>> getLatestVersion(
            @PathVariable Integer productId) {
        ProductVersionResponse result = productVersionService.getLatestVersion(productId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
