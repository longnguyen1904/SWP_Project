package com.tallt.marketplace.controller;

import com.tallt.marketplace.dto.ApiResponse;
import com.tallt.marketplace.dto.PageResponse;
import com.tallt.marketplace.dto.licensetier.CreateLicenseTierRequest;
import com.tallt.marketplace.dto.licensetier.LicenseTierResponse;
import com.tallt.marketplace.dto.licensetier.UpdateLicenseTierRequest;
import com.tallt.marketplace.dto.product.*;
import com.tallt.marketplace.entity.Vendor;
import com.tallt.marketplace.service.CloudinaryService;
import com.tallt.marketplace.service.LicenseTierService;
import com.tallt.marketplace.service.ProductService;
import com.tallt.marketplace.service.ProductVersionService;
import com.tallt.marketplace.service.VendorService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
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

    @Autowired
    private CloudinaryService cloudinaryService;

    /**
     * Lấy vendorId của user hiện tại (chỉ khi user là Vendor).
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> getCurrentVendorId(
            @RequestHeader(value = "X-User-Id", required = false) Integer userId) {
        Map<String, Integer> body = new HashMap<>();
        if (userId == null) {
            return ResponseEntity.ok(ApiResponse.success(body));
        }
        try {
            Vendor vendor = vendorService.getVendorByUserId(userId);
            body.put("vendorId", vendor.getVendorID());
            return ResponseEntity.ok(ApiResponse.success(body));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.success(body));
        }
    }

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
     * Upload 1 ảnh sản phẩm (JSON body - giữ tương thích cũ)
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
     * Upload nhiều ảnh sản phẩm qua Cloudinary (multipart/form-data)
     * POST /api/vendor/products/{productId}/images/upload
     * @param files danh sách file ảnh (tối đa 10)
     * @param imageType loại ảnh (SCREENSHOT, LOGO, BANNER) - mặc định SCREENSHOT
     */
    @PostMapping(value = "/products/{productId}/images/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadProductImages(
            @RequestHeader("X-User-Id") Integer userId,
            @PathVariable Integer productId,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "imageType", defaultValue = "SCREENSHOT") String imageType) {
        Vendor vendor = vendorService.getVendorByUserId(userId);

        if (files == null || files.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Phải chọn ít nhất 1 ảnh"));
        }

        if (files.size() > 10) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Tối đa 10 ảnh mỗi lần upload"));
        }

        List<String> urls = new ArrayList<>();
        for (MultipartFile file : files) {
            String url = cloudinaryService.uploadFile(file, "marketplace/products/" + productId + "/images");
            urls.add(url);
        }

        Map<String, Object> result = productService.uploadProductImages(vendor.getVendorID(), productId, urls, imageType);
        return ResponseEntity.ok(ApiResponse.success("Upload ảnh thành công", result));
    }

    /**
     * Xóa một ảnh sản phẩm
     * DELETE /api/vendor/products/{productId}/images/{imageId}
     */
    @DeleteMapping("/products/{productId}/images/{imageId}")
    public ResponseEntity<ApiResponse<Void>> deleteProductImage(
            @RequestHeader("X-User-Id") Integer userId,
            @PathVariable Integer productId,
            @PathVariable Integer imageId) {
        Vendor vendor = vendorService.getVendorByUserId(userId);
        productService.deleteProductImage(vendor.getVendorID(), productId, imageId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * Lấy danh sách sản phẩm của Vendor
     * GET /api/vendor/products
     */
    @GetMapping("/products")
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> getVendorProducts(
            @RequestHeader("X-User-Id") Integer userId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false, name = "q") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Vendor vendor = vendorService.getVendorByUserId(userId);
        System.out.println("Hello World");
        PageResponse<ProductResponse> result = productService.getVendorProducts(vendor.getVendorID(), search, null, status, page, size, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.success(result));
        
    }

    /**
     * Lấy chi tiết sản phẩm của Vendor (mọi status)
     * GET /api/vendor/products/{productId}
     */
    @GetMapping("/products/{productId}")
    public ResponseEntity<ApiResponse<ProductDetailResponse>> getVendorProduct(
            @RequestHeader("X-User-Id") Integer userId,
            @PathVariable Integer productId) {
        Vendor vendor = vendorService.getVendorByUserId(userId);
        ProductDetailResponse result = productService.getVendorProductDetail(vendor.getVendorID(), productId, 6);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Cập nhật sản phẩm
     * PUT /api/vendor/products/{productId}
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
     * Xóa sản phẩm
     * DELETE /api/vendor/products/{productId}
     */
    @DeleteMapping("/products/{productId}")
    public ResponseEntity<ApiResponse<String>> deleteProduct(
            @RequestHeader("X-User-Id") Integer userId,
            @PathVariable Integer productId) {
        Vendor vendor = vendorService.getVendorByUserId(userId);
        productService.deleteProduct(vendor.getVendorID(), productId);
        return ResponseEntity.ok(ApiResponse.success("Xóa sản phẩm thành công"));
    }

    /**
     * Lưu nháp sản phẩm (chỉ khi DRAFT hoặc REJECTED)
     * PUT /api/vendor/products/{productId}/draft
     */
    @PutMapping("/products/{productId}/draft")
    public ResponseEntity<ApiResponse<ProductResponse>> saveDraft(
            @RequestHeader("X-User-Id") Integer userId,
            @PathVariable Integer productId,
            @Valid @RequestBody UpdateProductRequest request) {
        Vendor vendor = vendorService.getVendorByUserId(userId);
        ProductResponse result = productService.saveDraft(vendor.getVendorID(), productId, request);
        return ResponseEntity.ok(ApiResponse.success("Lưu nháp thành công", result));
    }

    // ==================== PRODUCT VERSIONS ====================

    /**
     * Tạo phiên bản sản phẩm
     * POST /api/vendor/products/{productId}/versions
     */
    @PostMapping("/products/{productId}/versions")
    public ResponseEntity<ApiResponse<ProductVersionResponse>> createProductVersion(
            @RequestHeader("X-User-Id") Integer userId,
            @PathVariable Integer productId,
            @Valid @RequestBody CreateVersionRequest request) {
        Vendor vendor = vendorService.getVendorByUserId(userId);
        ProductVersionRequest versionRequest = new ProductVersionRequest();
        versionRequest.setVersionNumber(request.getVersionNumber());
        versionRequest.setFileUrl(request.getFileUrl());
        versionRequest.setReleaseNotes(request.getReleaseNotes());
        ProductVersionResponse result = productVersionService.createVersion(vendor.getVendorID(), productId, versionRequest);
        return ResponseEntity.ok(ApiResponse.success("Tạo phiên bản thành công", result));
    }

    /**
     * Lấy danh sách phiên bản sản phẩm
     * GET /api/vendor/products/{productId}/versions
     */
    @GetMapping("/products/{productId}/versions")
    public ResponseEntity<ApiResponse<List<ProductVersionResponse>>> getProductVersions(
            @RequestHeader("X-User-Id") Integer userId,
            @PathVariable Integer productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Vendor vendor = vendorService.getVendorByUserId(userId);
        PageResponse<ProductVersionResponse> result = productVersionService.getVersions(productId, page, size, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách phiên bản thành công", result.getContent()));
    }

    /**
     * Lấy chi tiết một phiên bản
     * GET /api/vendor/products/{productId}/versions/{versionId}
     */
    @GetMapping("/products/{productId}/versions/{versionId}")
    public ResponseEntity<ApiResponse<ProductVersionResponse>> getProductVersion(
            @RequestHeader("X-User-Id") Integer userId,
            @PathVariable Integer productId,
            @PathVariable Integer versionId) {
        Vendor vendor = vendorService.getVendorByUserId(userId);
        ProductVersionResponse result = productVersionService.getVersionById(vendor.getVendorID(), productId, versionId);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết phiên bản thành công", result));
    }

    /**
     * Cập nhật phiên bản sản phẩm
     * PUT /api/vendor/products/{productId}/versions/{versionId}
     */
    @PutMapping("/products/{productId}/versions/{versionId}")
    public ResponseEntity<ApiResponse<ProductVersionResponse>> updateProductVersion(
            @RequestHeader("X-User-Id") Integer userId,
            @PathVariable Integer productId,
            @PathVariable Integer versionId,
            @RequestBody UpdateVersionRequest request) {
        Vendor vendor = vendorService.getVendorByUserId(userId);
        ProductVersionResponse result = productVersionService.updateVersion(vendor.getVendorID(), productId, versionId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật phiên bản thành công", result));
    }

    // ==================== LICENSE TIERS ====================

    /**
     * Tạo license tier cho sản phẩm
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
     * Lấy danh sách license tiers của sản phẩm
     * GET /api/vendor/products/{productId}/license-tiers
     */
    @GetMapping("/products/{productId}/license-tiers")
    public ResponseEntity<ApiResponse<List<LicenseTierResponse>>> getProductLicenseTiers(
            @RequestHeader("X-User-Id") Integer userId,
            @PathVariable Integer productId) {
        Vendor vendor = vendorService.getVendorByUserId(userId);
        PageResponse<LicenseTierResponse> result = licenseTierService.getLicenseTiers(productId, 0, 100, "tierID", "asc");
        return ResponseEntity.ok(ApiResponse.success(result.getContent()));
    }

    /**
     * Cập nhật license tier
     * PUT /api/vendor/products/{productId}/license-tiers/{tierId}
     */
    @PutMapping("/products/{productId}/license-tiers/{tierId}")
    public ResponseEntity<ApiResponse<LicenseTierResponse>> updateLicenseTier(
            @RequestHeader("X-User-Id") Integer userId,
            @PathVariable Integer productId,
            @PathVariable Integer tierId,
            @Valid @RequestBody UpdateLicenseTierRequest request) {
        Vendor vendor = vendorService.getVendorByUserId(userId);
        LicenseTierResponse result = licenseTierService.updateLicenseTier(vendor.getVendorID(), tierId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật license tier thành công", result));
    }

    /**
     * Xóa license tier
     * DELETE /api/vendor/products/{productId}/license-tiers/{tierId}
     */
    @DeleteMapping("/products/{productId}/license-tiers/{tierId}")
    public ResponseEntity<ApiResponse<String>> deleteLicenseTier(
            @RequestHeader("X-User-Id") Integer userId,
            @PathVariable Integer productId,
            @PathVariable Integer tierId) {
        Vendor vendor = vendorService.getVendorByUserId(userId);
        licenseTierService.deleteLicenseTier(vendor.getVendorID(), tierId);
        return ResponseEntity.ok(ApiResponse.success("Xóa license tier thành công"));
    }

    // ==================== PRODUCT SUBMISSION ====================

    /**
     * Nộp sản phẩm để duyệt
     * POST /api/vendor/products/{productId}/submit
     */
    @PostMapping("/products/{productId}/submit")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitProduct(
            @RequestHeader("X-User-Id") Integer userId,
            @PathVariable Integer productId) {
        Vendor vendor = vendorService.getVendorByUserId(userId);
        Map<String, Object> result = productService.submitForApproval(vendor.getVendorID(), productId);
        return ResponseEntity.ok(ApiResponse.success("Gửi sản phẩm duyệt thành công", result));
    }
}
