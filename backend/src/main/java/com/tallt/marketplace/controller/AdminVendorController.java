package com.tallt.marketplace.controller;

import com.tallt.marketplace.dto.ApiResponse;
import com.tallt.marketplace.dto.PageResponse;
import com.tallt.marketplace.dto.vendor.VendorVerifyRequest;
import com.tallt.marketplace.entity.Vendor;
import com.tallt.marketplace.service.VendorService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller Admin quản lý Vendor
 * - Duyệt/từ chối Vendor
 * - Xem danh sách Vendor với filter, search, paging, sort
 */
@RestController
@RequestMapping("/api/admin/vendors")
public class AdminVendorController {

    @Autowired
    private VendorService vendorService;

    /**
     * Admin duyệt/từ chối Vendor
     * PUT /api/admin/vendors/{vendorId}/verify
     * - Nếu approved: IsVerified=1, VerifiedAt=now()
     * - Nếu rejected: Vendor vẫn inactive
     */
    @PutMapping("/{vendorId}/verify")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyVendor(
            @PathVariable Integer vendorId,
            @Valid @RequestBody VendorVerifyRequest request) {
        Map<String, Object> result = vendorService.verifyVendor(vendorId, request);
        return ResponseEntity.ok(ApiResponse.success("Xử lý xác thực Vendor thành công", result));
    }

    /**
     * Lấy danh sách Vendor với filter, search, paging, sort
     * GET /api/admin/vendors
     * - search: tìm theo companyName, fullName, email
     * - status: filter theo trạng thái (PENDING, APPROVED, REJECTED)
     * - type: filter theo loại vendor (INDIVIDUAL/COMPANY)
     * - page, size: phân trang
     * - sortBy, sortDir: sắp xếp
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<Vendor>>> getVendors(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "vendorID") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        PageResponse<Vendor> result = vendorService.getVendors(search, status, type, page, size, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Lấy chi tiết Vendor theo ID
     * GET /api/admin/vendors/{vendorId}
     */
    @GetMapping("/{vendorId}")
    public ResponseEntity<ApiResponse<Vendor>> getVendorById(@PathVariable Integer vendorId) {
        Vendor vendor = vendorService.getVendorById(vendorId);
        return ResponseEntity.ok(ApiResponse.success(vendor));
    }
}
