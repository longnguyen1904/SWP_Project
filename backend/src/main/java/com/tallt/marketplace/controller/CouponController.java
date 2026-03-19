package com.tallt.marketplace.controller;

import com.tallt.marketplace.dto.ApiResponse;
import com.tallt.marketplace.entity.Coupon;
import com.tallt.marketplace.service.CouponService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    private final CouponService couponService;

    public CouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Coupon>> createCoupon(
            @RequestHeader("X-User-Id") Integer userId,
            @RequestBody Map<String, Object> body) {
        Coupon coupon = couponService.createCoupon(userId, body);
        return ResponseEntity.ok(ApiResponse.success("Tạo coupon thành công", coupon));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<Coupon>>> getMyCoupons(
            @RequestHeader("X-User-Id") Integer userId) {
        List<Coupon> coupons = couponService.getCouponsByVendor(userId);
        return ResponseEntity.ok(ApiResponse.success("Danh sách coupon", coupons));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCoupon(
            @RequestHeader("X-User-Id") Integer userId,
            @PathVariable("id") Integer couponId) {
        couponService.deleteCoupon(userId, couponId);
        return ResponseEntity.ok(ApiResponse.success("Xóa coupon thành công", null));
    }

    @GetMapping("/validate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validateCoupon(
            @RequestParam("code") String code,
            @RequestParam("productId") Integer productId) {
        Map<String, Object> result = couponService.validateCoupon(code, productId);
        return ResponseEntity.ok(ApiResponse.success("Coupon hợp lệ", result));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCouponsForProduct(
            @PathVariable("productId") Integer productId) {
        List<Map<String, Object>> coupons = couponService.getActiveCouponsForProduct(productId);
        return ResponseEntity.ok(ApiResponse.success("Danh sách coupon", coupons));
    }
}
