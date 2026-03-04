package com.tallt.marketplace.controller;

import com.tallt.marketplace.dto.ApiResponse;
import com.tallt.marketplace.dto.PageResponse;
import com.tallt.marketplace.dto.product.ProductDetailResponse;
import com.tallt.marketplace.dto.product.ProductResponse;
import com.tallt.marketplace.dto.product.ProductVersionResponse;
import com.tallt.marketplace.dto.review.CreateReviewRequest;
import com.tallt.marketplace.dto.review.ReviewResponse;
import com.tallt.marketplace.service.ProductService;
import com.tallt.marketplace.service.ProductVersionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

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
     * UC12 - Gửi đánh giá sản phẩm (Customer, hoặc Vendor khi không phải sản phẩm của mình).
     */
    @PostMapping("/{productId}/reviews")
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @PathVariable Integer productId,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestBody @Valid CreateReviewRequest request) {
        ReviewResponse result = productService.createReview(
                productId, userId, request.getRating(), request.getComment());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Kiểm tra user hiện tại đã mua sản phẩm (có Order PaymentStatus != Pending).
     */
    @GetMapping("/{productId}/purchased")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkPurchased(
            @PathVariable Integer productId,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId) {
        boolean purchased = productService.hasPurchasedProduct(productId, userId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("purchased", purchased)));
    }

    /**
     * Customer sửa đánh giá của chính mình.
     */
    @PutMapping("/{productId}/reviews/{reviewId}")
    public ResponseEntity<ApiResponse<ReviewResponse>> updateReview(
            @PathVariable Integer productId,
            @PathVariable Integer reviewId,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestBody @Valid CreateReviewRequest request) {
        ReviewResponse result = productService.updateReview(
                reviewId, userId, request.getRating(), request.getComment());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Customer xóa đánh giá của chính mình.
     */
    @DeleteMapping("/{productId}/reviews/{reviewId}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @PathVariable Integer productId,
            @PathVariable Integer reviewId,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId) {
        productService.deleteReview(reviewId, userId);
        return ResponseEntity.ok(ApiResponse.success(null));
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
