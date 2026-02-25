package com.tallt.marketplace.controller;

import com.tallt.marketplace.dto.ApiResponse;
import com.tallt.marketplace.dto.PageResponse;
import com.tallt.marketplace.dto.licensetier.CreateLicenseTierRequest;
import com.tallt.marketplace.dto.licensetier.LicenseTierResponse;
import com.tallt.marketplace.dto.licensetier.UpdateLicenseTierRequest;
import com.tallt.marketplace.dto.product.*;
import com.tallt.marketplace.entity.Vendor;
import com.tallt.marketplace.service.LicenseTierService;
import com.tallt.marketplace.service.ProductService;
import com.tallt.marketplace.service.ProductVersionService;
import com.tallt.marketplace.service.VendorService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller Vendor quản lý sản phẩm
 * UC02 – Product Upload
 * UC03 – Product Management
 * UC04 – Version Control Manager
 * UC05 – License Tier Configuration
 */
@RestController
@RequestMapping("/api/vendor")
public class VendorProductController {

    @Autowired
    private ProductService productService;

    @Autowired
    private ProductVersionService productVersionService;

    @Autowired
    private LicenseTierService licenseTierService;

    @Autowired
    private VendorService vendorService;

    // ==================== PRODUCT CRUD ====================

    /**
     * Tạo sản phẩm mới
     * POST /api/vendor/products
     * - Insert vào Products (IsApproved=0)
     * - Insert tags vào Tags (nếu chưa tồn tại)
     * - Insert mapping vào ProductTags
     */
    @PostMapping("/products")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createProduct(
            @RequestHeader("X-User-Id") Integer userId,
            @Valid @RequestBody CreateProductRequest request) {
        Vendor vendor = vendorService.getVendorByUserId(userId);
        Map<String, Object> result = productService.createProduct(vendor.getVendorID(), request);
        return ResponseEntity.ok(ApiResponse.success("Tạo sản phẩm thành công", result));
    }

    /**
     * Upload ảnh sản phẩm
     * POST /api/vendor/products/{productId}/images
     */
    @PostMapping("/products/{productId}/images")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadProductImage(
            @RequestHeader("X-User-Id") Integer userId,
            @PathVariable Integer productId,
            @Valid @RequestBody ProductImageRequest request) {
        Vendor vendor = vendorService.getVendorByUserId(userId);
        Map<String, Object> result = productService.uploadProductImage(vendor.getVendorID(), productId, request);
        return ResponseEntity.ok(ApiResponse.success("Upload ảnh thành công", result));
    }

    /**
     * Cập nhật thông tin sản phẩm
     * PUT /api/vendor/products/{productId}
     * - Chỉ cho update khi Product chưa Approved
     * - Vendor phải là chủ sở hữu
     */
    @PutMapping("/products/{productId}")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @RequestHeader("X-User-Id") Integer userId,
            @PathVariable Integer productId,
            @Valid @RequestBody UpdateProductRequest request) {
        Vendor vendor = vendorService.getVendorByUserId(userId);
        ProductResponse result = productService.updateProduct(vendor.getVendorID(), productId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật sản phẩm thành công", result));
    }

    /**
     * Submit sản phẩm để Admin duyệt
     * POST /api/vendor/products/{productId}/submit
     * - Validate: có ít nhất 1 version, có ít nhất 1 license tier
     */
    @PostMapping("/products/{productId}/submit")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitForApproval(
            @RequestHeader("X-User-Id") Integer userId,
            @PathVariable Integer productId) {
        Vendor vendor = vendorService.getVendorByUserId(userId);
        Map<String, Object> result = productService.submitForApproval(vendor.getVendorID(), productId);
        return ResponseEntity.ok(ApiResponse.success("Gửi sản phẩm để duyệt thành công", result));
    }

    /**
     * Lấy danh sách sản phẩm của Vendor với filter, search, paging, sort
     * GET /api/vendor/products
     */
    @GetMapping("/products")
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> getVendorProducts(
            @RequestHeader("X-User-Id") Integer userId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "productID") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Vendor vendor = vendorService.getVendorByUserId(userId);
        PageResponse<ProductResponse> result = productService.getVendorProducts(
                vendor.getVendorID(), search, categoryId, status, page, size, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ==================== PRODUCT VERSIONS ====================

    /**
     * Tạo phiên bản mới cho sản phẩm
     * POST /api/vendor/products/{productId}/versions
     */
    @PostMapping("/products/{productId}/versions")
    public ResponseEntity<ApiResponse<ProductVersionResponse>> createVersion(
            @RequestHeader("X-User-Id") Integer userId,
            @PathVariable Integer productId,
            @Valid @RequestBody ProductVersionRequest request) {
        Vendor vendor = vendorService.getVendorByUserId(userId);
        ProductVersionResponse result = productVersionService.createVersion(vendor.getVendorID(), productId, request);
        return ResponseEntity.ok(ApiResponse.success("Tạo phiên bản thành công", result));
    }

    /**
     * Lấy danh sách phiên bản của sản phẩm (Vendor)
     * GET /api/vendor/products/{productId}/versions
     */
    @GetMapping("/products/{productId}/versions")
    public ResponseEntity<ApiResponse<PageResponse<ProductVersionResponse>>> getVersions(
            @PathVariable Integer productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        PageResponse<ProductVersionResponse> result = productVersionService.getVersions(
                productId, page, size, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ==================== LICENSE TIERS ====================

    /**
     * Tạo License Tier cho sản phẩm
     * POST /api/vendor/products/{productId}/license-tiers
     */
    @PostMapping("/products/{productId}/license-tiers")
    public ResponseEntity<ApiResponse<LicenseTierResponse>> createLicenseTier(
            @RequestHeader("X-User-Id") Integer userId,
            @PathVariable Integer productId,
            @Valid @RequestBody CreateLicenseTierRequest request) {
        Vendor vendor = vendorService.getVendorByUserId(userId);
        LicenseTierResponse result = licenseTierService.createLicenseTier(vendor.getVendorID(), productId, request);
        return ResponseEntity.ok(ApiResponse.success("Tạo license tier thành công", result));
    }

    /**
     * Cập nhật License Tier
     * PUT /api/vendor/license-tiers/{tierId}
     */
    @PutMapping("/license-tiers/{tierId}")
    public ResponseEntity<ApiResponse<LicenseTierResponse>> updateLicenseTier(
            @RequestHeader("X-User-Id") Integer userId,
            @PathVariable Integer tierId,
            @Valid @RequestBody UpdateLicenseTierRequest request) {
        Vendor vendor = vendorService.getVendorByUserId(userId);
        LicenseTierResponse result = licenseTierService.updateLicenseTier(vendor.getVendorID(), tierId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật license tier thành công", result));
    }

    /**
     * Lấy danh sách License Tier của sản phẩm
     * GET /api/vendor/products/{productId}/license-tiers
     */
    @GetMapping("/products/{productId}/license-tiers")
    public ResponseEntity<ApiResponse<PageResponse<LicenseTierResponse>>> getLicenseTiers(
            @PathVariable Integer productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "tierID") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        PageResponse<LicenseTierResponse> result = licenseTierService.getLicenseTiers(
                productId, page, size, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
