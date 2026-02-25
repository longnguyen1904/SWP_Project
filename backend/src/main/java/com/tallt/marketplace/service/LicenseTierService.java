package com.tallt.marketplace.service;

import com.tallt.marketplace.dto.PageResponse;
import com.tallt.marketplace.dto.licensetier.CreateLicenseTierRequest;
import com.tallt.marketplace.dto.licensetier.LicenseTierResponse;
import com.tallt.marketplace.dto.licensetier.UpdateLicenseTierRequest;
import com.tallt.marketplace.entity.LicenseTier;
import com.tallt.marketplace.entity.Product;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.repository.LicenseTierRepository;
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

    /**
     * Tạo License Tier cho sản phẩm
     * - Kiểm tra sản phẩm tồn tại & Vendor là chủ sở hữu
     * - Insert vào LicenseTiers
     */
    @Transactional
    public LicenseTierResponse createLicenseTier(Integer vendorId, Integer productId,
                                                  CreateLicenseTierRequest request) {
        Product product = validateProductOwnership(vendorId, productId);

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
     * Cập nhật License Tier
     * - Kiểm tra tier tồn tại & Vendor là chủ sở hữu sản phẩm
     */
    @Transactional
    public LicenseTierResponse updateLicenseTier(Integer vendorId, Integer tierId,
                                                  UpdateLicenseTierRequest request) {
        LicenseTier tier = licenseTierRepository.findById(tierId)
                .orElseThrow(() -> new AppException("License Tier không tồn tại"));

        // Kiểm tra Vendor là chủ sở hữu sản phẩm
        if (!tier.getProduct().getVendor().getVendorID().equals(vendorId)) {
            throw new AppException("Bạn không có quyền thao tác trên license tier này");
        }

        if (request.getTierName() != null) {
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
     * Lấy danh sách License Tier của sản phẩm với paging, sort
     */
    public PageResponse<LicenseTierResponse> getLicenseTiers(Integer productId,
                                                              int page, int size, String sortBy, String sortDir) {
        if (!productRepository.existsById(productId)) {
            throw new AppException("Sản phẩm không tồn tại");
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

    private Product validateProductOwnership(Integer vendorId, Integer productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException("Sản phẩm không tồn tại"));

        if (!product.getVendor().getVendorID().equals(vendorId)) {
            throw new AppException("Bạn không có quyền thao tác trên sản phẩm này");
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
