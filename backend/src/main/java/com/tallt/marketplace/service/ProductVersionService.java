package com.tallt.marketplace.service;

import com.tallt.marketplace.dto.PageResponse;
import com.tallt.marketplace.dto.product.ProductVersionRequest;
import com.tallt.marketplace.dto.product.ProductVersionResponse;
import com.tallt.marketplace.entity.Product;
import com.tallt.marketplace.entity.ProductVersion;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.repository.ProductRepository;
import com.tallt.marketplace.repository.ProductVersionRepository;
import com.tallt.marketplace.repository.VendorRepository;
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
public class ProductVersionService {

    @Autowired
    private ProductVersionRepository productVersionRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private VendorRepository vendorRepository;

    /**
     * Tạo phiên bản mới cho sản phẩm
     * - Kiểm tra sản phẩm tồn tại & Vendor là chủ sở hữu
     * - Insert vào ProductVersions
     */
    @Transactional
    public ProductVersionResponse createVersion(Integer vendorId, Integer productId, ProductVersionRequest request) {
        Product product = validateProductOwnership(vendorId, productId);

        ProductVersion version = new ProductVersion();
        version.setProduct(product);
        version.setVersionNumber(request.getVersionNumber());
        version.setFileUrl(request.getFileUrl());
        version.setReleaseNotes(request.getReleaseNotes());
        productVersionRepository.save(version);

        return toResponse(version);
    }

    /**
     * Lấy phiên bản mới nhất của sản phẩm
     * - Order by CreatedAt DESC, return 1 record
     */
    public ProductVersionResponse getLatestVersion(Integer productId) {
        // Kiểm tra sản phẩm tồn tại
        if (!productRepository.existsById(productId)) {
            throw new AppException("Sản phẩm không tồn tại");
        }

        ProductVersion version = productVersionRepository
                .findTopByProduct_ProductIDOrderByCreatedAtDesc(productId)
                .orElseThrow(() -> new AppException("Sản phẩm chưa có phiên bản nào"));

        return toResponse(version);
    }

    /**
     * Lấy danh sách phiên bản của sản phẩm với paging, sort
     */
    public PageResponse<ProductVersionResponse> getVersions(Integer productId,
                                                             int page, int size, String sortBy, String sortDir) {
        if (!productRepository.existsById(productId)) {
            throw new AppException("Sản phẩm không tồn tại");
        }

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<ProductVersion> versionPage = productVersionRepository.findByProduct_ProductID(productId, pageable);

        List<ProductVersionResponse> responses = versionPage.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        PageResponse<ProductVersionResponse> response = new PageResponse<>();
        response.setContent(responses);
        response.setPage(versionPage.getNumber());
        response.setSize(versionPage.getSize());
        response.setTotalElements(versionPage.getTotalElements());
        response.setTotalPages(versionPage.getTotalPages());
        response.setLast(versionPage.isLast());
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

    private ProductVersionResponse toResponse(ProductVersion version) {
        ProductVersionResponse response = new ProductVersionResponse();
        response.setVersionId(version.getVersionID());
        response.setProductId(version.getProduct().getProductID());
        response.setVersionNumber(version.getVersionNumber());
        response.setFileUrl(version.getFileUrl());
        response.setReleaseNotes(version.getReleaseNotes());
        response.setCreatedAt(version.getCreatedAt());
        return response;
    }
}
