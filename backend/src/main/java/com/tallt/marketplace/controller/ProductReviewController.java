package com.tallt.marketplace.controller;

import com.tallt.marketplace.dto.ApiResponse;
import com.tallt.marketplace.dto.review.CreateReviewRequest;
import com.tallt.marketplace.dto.review.ReviewResponse;
import com.tallt.marketplace.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.web.bind.annotation.*;

/**
 * Endpoint riêng cho sửa/xóa review theo reviewId để tránh xung đột mapping với
 * /api/products/{productId}.
 * PUT /api/reviews/{reviewId} — sửa đánh giá (customer, chủ review).
 * DELETE /api/reviews/{reviewId} — xóa đánh giá (customer, chủ review).
 */
@RestController
@RequestMapping("/api/reviews")
public class ProductReviewController {

    @Autowired
    private ProductService productService;

    @PutMapping("/{reviewId}")
    public ApiResponse<ReviewResponse> updateReview(
            @PathVariable Integer reviewId,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestBody @Valid CreateReviewRequest request) {
        ReviewResponse result = productService.updateReview(
                reviewId, userId, request.getRating(), request.getComment());
        return ApiResponse.success(result);
    }

    @DeleteMapping("/{reviewId}")
    public ApiResponse<Void> deleteReview(
            @PathVariable Integer reviewId,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId) {
        productService.deleteReview(reviewId, userId);
        return ApiResponse.success(null);
    }
}
