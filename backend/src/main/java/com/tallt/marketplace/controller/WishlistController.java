package com.tallt.marketplace.controller;

import com.tallt.marketplace.dto.ApiResponse;
import com.tallt.marketplace.dto.WishlistItemResponse;
import com.tallt.marketplace.service.WishlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wishlists")
public class WishlistController {

    @Autowired
    private WishlistService wishlistService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<WishlistItemResponse>>> getMyWishlist(
            @RequestHeader("X-User-Id") Integer userId) {
        List<WishlistItemResponse> items = wishlistService.getWishlistByUser(userId);
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    @PostMapping("/toggle")
    public ResponseEntity<ApiResponse<String>> toggleWishlist(
            @RequestHeader("X-User-Id") Integer userId,
            @RequestParam Integer productId) {
        String message = wishlistService.toggleWishlist(userId, productId);
        return ResponseEntity.ok(ApiResponse.success(message, message));
    }

    @GetMapping("/check")
    public ResponseEntity<ApiResponse<Boolean>> checkWishlist(
            @RequestHeader("X-User-Id") Integer userId,
            @RequestParam Integer productId) {
        boolean isWished = wishlistService.isWished(userId, productId);
        return ResponseEntity.ok(ApiResponse.success(isWished));
    }
}
