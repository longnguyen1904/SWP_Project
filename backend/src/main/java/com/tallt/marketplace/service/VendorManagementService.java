package com.tallt.marketplace.service;

import com.tallt.marketplace.entity.*;
import com.tallt.marketplace.entity.Product.ProductStatus;
import com.tallt.marketplace.entity.Vendor.VendorStatus;
import com.tallt.marketplace.entity.Vendor.VendorType;
import com.tallt.marketplace.repository.*;
import com.tallt.marketplace.constant.MessageConstant;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VendorManagementService {



    private final VendorRepository vendorRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    // GET BY ID
    public Vendor getVendorById(Integer id) {
        return vendorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vendor not found"));
    }

    // GET WITH FILTER + PAGINATION
    public Page<Vendor> getVendors(
            int page, int size, String sortBy, String direction,
            VendorStatus status, VendorType type) {

        Sort sort = Sort.by(
                direction.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC,
                sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        if (status != null && type != null)
            return vendorRepository.findByStatusAndType(status, type, pageable);
        if (status != null)
            return vendorRepository.findByStatus(status, pageable);
        if (type != null)
            return vendorRepository.findByType(type, pageable);

        return vendorRepository.findAll(pageable);
    }

  
    // APPROVE / REJECT / SUSPEND VENDOR
    @Transactional
    public Vendor updateVendorStatus(Integer id, VendorStatus status, String rejectionNote) {

        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vendor not found"));

        vendor.setStatus(status);

        if (status == VendorStatus.APPROVED) {
            Role vendorRole = roleRepository.findByRoleName("VENDOR")
                    .orElseThrow(() -> new RuntimeException("Role VENDOR not found"));

            User user = vendor.getUser();
            user.setRole(vendorRole);
            userRepository.save(user);

            vendor.setVerifiedAt(LocalDateTime.now());
            vendor.setRejectionNote(null);

            List<Product> wasApproved = productRepository
                    .findByVendor_VendorIDAndStatusAndRejectionNote(
                            vendor.getVendorID(),
                            ProductStatus.REJECTED,
                            MessageConstant.SUSPENDED_FROM_APPROVED);

            for (Product product : wasApproved) {
                product.setStatus(ProductStatus.APPROVED);
                product.setRejectionNote(null);
            }
            productRepository.saveAll(wasApproved);

            // ✅ Restore sản phẩm vốn là PENDING → trả về PENDING (không tự APPROVED)
            List<Product> wasPending = productRepository
                    .findByVendor_VendorIDAndStatusAndRejectionNote(
                            vendor.getVendorID(),
                            ProductStatus.REJECTED,
                            MessageConstant.SUSPENDED_FROM_PENDING);

            for (Product product : wasPending) {
                product.setStatus(ProductStatus.PENDING);
                product.setRejectionNote(null);
            }
            productRepository.saveAll(wasPending);
        }

        else if (status == VendorStatus.REJECTED) {
            if (rejectionNote == null || rejectionNote.trim().isEmpty()) {
                throw new RuntimeException("Rejection note is required");
            }
            vendor.setRejectionNote(rejectionNote);
        }

        else if (status == VendorStatus.SUSPENDED) {
            if (rejectionNote != null && !rejectionNote.trim().isEmpty()) {
                vendor.setRejectionNote(rejectionNote);
            } else {
                vendor.setRejectionNote(null);
            }

            vendor.setIdentificationDoc(null);


            List<Product> approvedProducts = productRepository
                    .findByVendor_VendorIDAndStatusIn(
                            vendor.getVendorID(),
                            List.of(ProductStatus.APPROVED));

            for (Product product : approvedProducts) {
                product.setStatus(ProductStatus.REJECTED);
                product.setRejectionNote(MessageConstant.SUSPENDED_FROM_APPROVED); 
            }
            productRepository.saveAll(approvedProducts);

            List<Product> pendingProducts = productRepository
                    .findByVendor_VendorIDAndStatusIn(
                            vendor.getVendorID(),
                            List.of(ProductStatus.PENDING));

            for (Product product : pendingProducts) {
                product.setStatus(ProductStatus.REJECTED);
                product.setRejectionNote(MessageConstant.SUSPENDED_FROM_PENDING); 
            }
            productRepository.saveAll(pendingProducts);
        }

        return vendorRepository.save(vendor);
    }

    @Transactional
    public Vendor saveIdentificationUrl(Integer id, String url) {
        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vendor not found"));

        if (url == null || url.trim().isEmpty()) {
            throw new RuntimeException("URL is empty");
        }

        vendor.setIdentificationDoc(url);
        return vendorRepository.save(vendor);
    }
}