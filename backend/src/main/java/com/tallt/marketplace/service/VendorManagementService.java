package com.tallt.marketplace.service;

import com.tallt.marketplace.entity.Vendor;
import com.tallt.marketplace.entity.Vendor.VendorStatus;
import com.tallt.marketplace.entity.Vendor.VendorType;
import com.tallt.marketplace.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class VendorManagementService {

    private final VendorRepository vendorRepository;

    // ===============================
    // Search by ID
    // ===============================
    public Vendor getVendorById(Integer id) {
        return vendorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vendor not found with id: " + id));
    }

    // ===============================
    // Pagination + Sort + Filter
    // ===============================
    public Page<Vendor> getVendors(
            int page,
            int size,
            String sortBy,
            String direction,
            VendorStatus status,
            VendorType type
    ) {

        Sort sort = Sort.by(
                direction.equalsIgnoreCase("desc") ?
                        Sort.Direction.DESC :
                        Sort.Direction.ASC,
                sortBy == null ? "vendorID" : sortBy
        );

        Pageable pageable = PageRequest.of(page, size, sort);

        if (status != null && type != null) {
            return vendorRepository.findByStatusAndType(status, type, pageable);
        }

        if (status != null) {
            return vendorRepository.findByStatus(status, pageable);
        }

        if (type != null) {
            return vendorRepository.findByType(type, pageable);
        }

        return vendorRepository.findAll(pageable);
    }
    public Vendor updateVendorStatus(Integer id, VendorStatus status) {
    Vendor vendor = vendorRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Vendor not found"));

    vendor.setStatus(status);
    return vendorRepository.save(vendor);
}
}