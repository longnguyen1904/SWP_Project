package com.tallt.marketplace.service;

import com.tallt.marketplace.entity.*;
import com.tallt.marketplace.entity.Vendor.VendorStatus;
import com.tallt.marketplace.entity.Vendor.VendorType;
import com.tallt.marketplace.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class VendorManagementService {

    private final VendorRepository vendorRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;

    public Vendor getVendorById(Integer id) {
        return vendorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vendor not found"));
    }

    public Page<Vendor> getVendors(
            int page,
            int size,
            String sortBy,
            String direction,
            VendorStatus status,
            VendorType type) {

        Sort sort = Sort.by(
                direction.equalsIgnoreCase("desc") ?
                        Sort.Direction.DESC :
                        Sort.Direction.ASC,
                sortBy
        );

        Pageable pageable = PageRequest.of(page, size, sort);

        if (status != null && type != null)
            return vendorRepository.findByStatusAndType(status, type, pageable);

        if (status != null)
            return vendorRepository.findByStatus(status, pageable);

        if (type != null)
            return vendorRepository.findByType(type, pageable);

        return vendorRepository.findAll(pageable);
    }

    // ==============================
    // DUYỆT VENDOR
    // ==============================
    @Transactional
    public Vendor updateVendorStatus(Integer id, VendorStatus status) {

        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vendor not found"));

        vendor.setStatus(status);

        if (status == VendorStatus.APPROVED) {

            // 1️⃣ Lấy role VENDOR
            Role vendorRole = roleRepository.findByRoleName("VENDOR")
                    .orElseThrow(() -> new RuntimeException("Role VENDOR not found"));

            // 2️⃣ Update role cho user
            User user = vendor.getUser();
            user.setRole(vendorRole);
            userRepository.save(user);

            // 3️⃣ Set verified time
            vendor.setVerifiedAt(LocalDateTime.now());
        }

        return vendorRepository.save(vendor);
    }
}