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
 * Controller xử lý đăng ký Vendor
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
     * Đăng ký trở thành Vendor
     * POST /api/vendors/register
     * - User gửi thông tin xác thực để trở thành Vendor
     * - Tạo bản ghi Vendors (IsVerified=0, IsActive=1)
     * - Cập nhật Users.RoleID = 2 (Vendor)
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<VendorRegisterResponse>> registerVendor(
            @RequestHeader("X-User-Id") Integer userId,
            @Valid @RequestBody VendorRegisterRequest request) {
        VendorRegisterResponse result = vendorService.registerVendor(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Đăng ký Vendor thành công", result));
    }

    /**
     * UC24 - Vendor Shop Page: lấy thông tin vendor public
     * GET /api/vendors/{vendorId}
     */
    @GetMapping("/{vendorId}")
    public ResponseEntity<ApiResponse<VendorShopResponse>> getVendorShop(@PathVariable Integer vendorId) {
        VendorShopResponse result = vendorService.getVendorShop(vendorId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * UC24 - Vendor Shop Page: list sản phẩm public theo vendor (approved only)
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
}
