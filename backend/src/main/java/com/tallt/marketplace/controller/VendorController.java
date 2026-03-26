package com.tallt.marketplace.controller;

import com.tallt.marketplace.dto.ApiResponse;
import com.tallt.marketplace.dto.PageResponse;
import com.tallt.marketplace.dto.product.ProductResponse;
import com.tallt.marketplace.dto.vendor.VendorRegisterRequest;
import com.tallt.marketplace.dto.vendor.VendorRegisterResponse;
import com.tallt.marketplace.dto.vendor.VendorShopResponse;
import com.tallt.marketplace.service.ProductService;
import com.tallt.marketplace.service.VendorService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

/**
 * Controller for Vendor Registration
 * UC01 – Vendor Registration
 */
@RestController
@RequestMapping("/api/vendors")
public class VendorController {

    @Autowired
    private VendorService vendorService;

    @Autowired
    private ProductService productService;

    /**
     * Check current user's vendor registration status
     * GET /api/vendors/my-status
     */
    @GetMapping("/my-status")
    public ResponseEntity<ApiResponse<?>> getMyVendorStatus(
            @RequestHeader("X-User-Id") Integer userId) {
        return ResponseEntity.ok(ApiResponse.success(vendorService.getMyVendorStatus(userId)));
    }

    /**
     * Register as a Vendor
     * POST /api/vendors/register
     * - User submits verification info to become a Vendor
     * - Creates Vendors record (Status=PENDING)
     * - Role remains CUSTOMER until Admin approves
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<VendorRegisterResponse>> registerVendor(
            @RequestHeader("X-User-Id") Integer userId,
            @Valid @RequestBody VendorRegisterRequest request) {
        VendorRegisterResponse result = vendorService.registerVendor(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Vendor registration successful", result));
    }

    /**
     * UC24 - Vendor Shop Page: get public vendor info
     * GET /api/vendors/{vendorId}
     */
    @GetMapping("/{vendorId}")
    public ResponseEntity<ApiResponse<VendorShopResponse>> getVendorShop(@PathVariable Integer vendorId) {
        VendorShopResponse result = vendorService.getVendorShop(vendorId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * UC24 - Vendor Shop Page: list public products by vendor (approved only)
     * GET /api/vendors/{vendorId}/products
     */
    @GetMapping("/{vendorId}/products")
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> getVendorProducts(
            @PathVariable Integer vendorId,
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
        PageResponse<ProductResponse> result = productService.getVendorStorefrontProducts(
                vendorId, search, categoryId, hasTrial, minPrice, maxPrice, tag, page, size, sortBy, sortDir
        );
        return ResponseEntity.ok(ApiResponse.success(result));
    }
    @PostMapping("/resubmit-identification")
    public ResponseEntity<ApiResponse<?>> resubmitIdentification(
            @RequestHeader("X-User-Id") Integer userId,
            @RequestBody java.util.Map<String, String> body) {
        String identificationUrl = body.get("identificationUrl");
        var result = vendorService.resubmitIdentification(userId, identificationUrl);
        return ResponseEntity.ok(ApiResponse.success("Identification resubmitted successfully", result));
    }

}
