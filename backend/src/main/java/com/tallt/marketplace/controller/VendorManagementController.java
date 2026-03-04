package com.tallt.marketplace.controller;

import com.tallt.marketplace.dto.ApiResponse;
import com.tallt.marketplace.dto.vendor.VendorVerifyRequest;
import com.tallt.marketplace.entity.Vendor;
import com.tallt.marketplace.entity.Vendor.VendorStatus;
import com.tallt.marketplace.entity.Vendor.VendorType;
import com.tallt.marketplace.service.VendorManagementService;
import com.tallt.marketplace.service.VendorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/vendors")
@RequiredArgsConstructor
public class VendorManagementController {

    private final VendorManagementService vendorManagementService;
    private final VendorService vendorService;

    @GetMapping
    public Page<Vendor> getVendors(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(defaultValue = "vendorID") String sortBy,
            @RequestParam(defaultValue = "asc") String direction,
            @RequestParam(required = false) VendorStatus status,
            @RequestParam(required = false) VendorType type) {

        return vendorManagementService.getVendors(page, size, sortBy, direction, status, type);
    }

    @GetMapping("/{id}")
    public Vendor getVendorById(@PathVariable Integer id) {
        return vendorManagementService.getVendorById(id);
    }

    @PostMapping("/{id}/upload-cccd")
    public Vendor uploadIdentification(
            @PathVariable Integer id,
            @RequestParam("url") String url) {

        return vendorManagementService.saveIdentificationUrl(id, url);
    }

    @PutMapping("/{id}/status")
    public Vendor updateVendorStatus(
            @PathVariable Integer id,
            @RequestParam VendorStatus status) {

        return vendorManagementService.updateVendorStatus(id, status);
    }

    @PutMapping("/{vendorId}/verify")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyVendor(
            @PathVariable Integer vendorId,
            @Valid @RequestBody VendorVerifyRequest request) {
        Map<String, Object> result = vendorService.verifyVendor(vendorId, request);
        return ResponseEntity.ok(ApiResponse.success("Vendor verification processed successfully", result));
    }
}
