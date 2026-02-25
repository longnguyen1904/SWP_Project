package com.tallt.marketplace.controller;

import com.tallt.marketplace.dto.ApiResponse;
import com.tallt.marketplace.dto.PageResponse;
import com.tallt.marketplace.dto.product.ProductResponse;
import com.tallt.marketplace.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller Admin quản lý sản phẩm
 * - Duyệt/từ chối sản phẩm
 * - Xem danh sách sản phẩm với filter, search, paging, sort
 */
@RestController
@RequestMapping("/api/admin/products")
public class AdminProductController {

    @Autowired
    private ProductService productService;

    /**
     * Admin duyệt/từ chối sản phẩm
     * PUT /api/admin/products/{productId}/review
     * Body: { "status": "APPROVED" | "REJECTED", "note": "..." }
     */
    @PutMapping("/{productId}/review")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reviewProduct(
            @PathVariable Integer productId,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        String note = body.get("note");
        Map<String, Object> result = productService.reviewProduct(productId, status, note);
        return ResponseEntity.ok(ApiResponse.success("Xử lý duyệt sản phẩm thành công", result));
    }

    /**
     * Lấy tất cả sản phẩm (Admin) với filter, search, paging, sort
     * GET /api/admin/products
     * - search: tìm theo productName, description
     * - categoryId: filter theo danh mục
     * - status: filter theo trạng thái (DRAFT, PENDING, APPROVED, REJECTED)
     * - vendorId: filter theo vendor
     * - page, size: phân trang
     * - sortBy, sortDir: sắp xếp
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> getAllProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer vendorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "productID") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        PageResponse<ProductResponse> result = productService.getAllProducts(
                search, categoryId, status, vendorId, page, size, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Lấy chi tiết sản phẩm theo ID
     * GET /api/admin/products/{productId}
     */
    @GetMapping("/{productId}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable Integer productId) {
        ProductResponse result = productService.getProductById(productId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
