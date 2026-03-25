package com.tallt.marketplace.service;

import com.tallt.marketplace.dto.PageResponse;
import com.tallt.marketplace.dto.licensetier.CreateLicenseTierRequest;
import com.tallt.marketplace.dto.licensetier.LicenseTierResponse;
import com.tallt.marketplace.dto.licensetier.UpdateLicenseTierRequest;
import com.tallt.marketplace.entity.LicenseTier;
import com.tallt.marketplace.entity.Product;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.repository.LicenseTierRepository;
import com.tallt.marketplace.repository.LicenseRepository;
import com.tallt.marketplace.repository.OrderRepository;
import com.tallt.marketplace.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class LicenseTierService {

    @Autowired
    private LicenseTierRepository licenseTierRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private LicenseRepository licenseRepository;

    @Autowired
    private OrderRepository orderRepository;

    /**
     * Create License Tier for product
     * - Check product exists & Vendor is the owner
     * - Insert into LicenseTiers
     */
    @Transactional
    public LicenseTierResponse createLicenseTier(Integer vendorId, Integer productId,
                                                  CreateLicenseTierRequest request) {
        Product product = validateProductOwnership(vendorId, productId);

        // Check duplicate tier name
        if (licenseTierRepository.existsByProduct_ProductIDAndTierName(productId, request.getTierName())) {
            throw new AppException("Tier \"" + request.getTierName() + "\" already exists for this product");
        }

        LicenseTier tier = new LicenseTier();
        tier.setProduct(product);
        tier.setTierName(request.getTierName());
        tier.setPrice(request.getPrice());
        tier.setMaxDevices(request.getMaxDevices());
        tier.setDurationDays(request.getDurationDays());
        tier.setContent(request.getContent());
        tier.setTierCode(request.getTierCode());
        licenseTierRepository.save(tier);

        return toResponse(tier);
    }

    /**
     * Update License Tier
     * - Check tier exists & Vendor is the owner of the product
     */
    @Transactional
    public LicenseTierResponse updateLicenseTier(Integer vendorId, Integer tierId,
                                                  UpdateLicenseTierRequest request) {
        LicenseTier tier = licenseTierRepository.findById(tierId)
                .orElseThrow(() -> new AppException("License Tier does not exist"));

        // Check Vendor is the owner of the product
        if (!tier.getProduct().getVendor().getVendorID().equals(vendorId)) {
            throw new AppException("You do not have permission to perform this action on this license tier");
        }

        if (request.getTierName() != null) {
            // Check duplicate tier name (exclude current tier)
            if (licenseTierRepository.existsByProduct_ProductIDAndTierNameAndTierIDNot(
                    tier.getProduct().getProductID(), request.getTierName(), tierId)) {
                throw new AppException("Tier \"" + request.getTierName() + "\" already exists for this product");
            }
            tier.setTierName(request.getTierName());
        }
        if (request.getPrice() != null) {
            tier.setPrice(request.getPrice());
        }
        if (request.getMaxDevices() != null) {
            tier.setMaxDevices(request.getMaxDevices());
        }
        if (request.getDurationDays() != null) {
            tier.setDurationDays(request.getDurationDays());
        }
        if (request.getContent() != null) {
            tier.setContent(request.getContent());
        }
        if (request.getTierCode() != null) {
            tier.setTierCode(request.getTierCode());
        }
        licenseTierRepository.save(tier);

        return toResponse(tier);
    }

    /**
     * Get list of License Tiers for product with paging, sort
     */
    public PageResponse<LicenseTierResponse> getLicenseTiers(Integer productId,
                                                              int page, int size, String sortBy, String sortDir) {
        if (!productRepository.existsById(productId)) {
            throw new AppException("Product does not exist");
        }

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<LicenseTier> tierPage = licenseTierRepository.findByProduct_ProductID(productId, pageable);

        List<LicenseTierResponse> responses = tierPage.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        PageResponse<LicenseTierResponse> response = new PageResponse<>();
        response.setContent(responses);
        response.setPage(tierPage.getNumber());
        response.setSize(tierPage.getSize());
        response.setTotalElements(tierPage.getTotalElements());
        response.setTotalPages(tierPage.getTotalPages());
        response.setLast(tierPage.isLast());
        return response;
    }

    // ==================== HELPER METHODS ====================

    /**
     * Delete license tier
     * - Vendor must be the owner
     */
    @Transactional
    public void deleteLicenseTier(Integer vendorId, Integer tierId) {
        LicenseTier tier = licenseTierRepository.findById(tierId)
                .orElseThrow(() -> new AppException("License Tier does not exist"));

        // Check Vendor is the owner of the product
        if (!tier.getProduct().getVendor().getVendorID().equals(vendorId)) {
            throw new AppException("You do not have permission to perform this action on this license tier");
        }

        // Check for active licenses or orders referencing this tier
        boolean hasLicenses = licenseRepository.existsByTier_TierID(tierId);
        boolean hasOrders = orderRepository.existsByTier_TierID(tierId);
        if (hasLicenses || hasOrders) {
            throw new AppException("Cannot delete this tier because it has active licenses or orders.");
        }

        // Check minimum tier count
        Integer productId = tier.getProduct().getProductID();
        long tierCount = licenseTierRepository.countByProduct_ProductID(productId);
        if (tierCount <= 1) {
            throw new AppException("Cannot delete the last license tier. A product must have at least one tier.");
        }

        licenseTierRepository.delete(tier);
    }

    private Product validateProductOwnership(Integer vendorId, Integer productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException("Product does not exist"));

        if (!product.getVendor().getVendorID().equals(vendorId)) {
            throw new AppException("You do not have permission to perform this action on this product");
        }
        return product;
    }

    private LicenseTierResponse toResponse(LicenseTier tier) {
        LicenseTierResponse response = new LicenseTierResponse();
        response.setTierId(tier.getTierID());
        response.setProductId(tier.getProduct().getProductID());
        response.setTierName(tier.getTierName());
        response.setPrice(tier.getPrice());
        response.setMaxDevices(tier.getMaxDevices());
        response.setDurationDays(tier.getDurationDays());
        response.setContent(tier.getContent());
        response.setTierCode(tier.getTierCode());
        return response;
    }
}
