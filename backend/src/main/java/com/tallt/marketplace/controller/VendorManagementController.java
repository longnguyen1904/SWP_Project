package com.tallt.marketplace.controller;

import com.tallt.marketplace.entity.Vendor;
import com.tallt.marketplace.entity.Vendor.VendorStatus;
import com.tallt.marketplace.entity.Vendor.VendorType;
import com.tallt.marketplace.service.VendorManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/vendors")
@RequiredArgsConstructor
public class VendorManagementController {

    private final VendorManagementService vendorManagementService;

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

    @PutMapping("/{id}/status")
    public Vendor updateVendorStatus(
            @PathVariable Integer id,
            @RequestParam Vendor.VendorStatus status) {
        return vendorManagementService.updateVendorStatus(id, status);
    }
}