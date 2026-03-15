package com.tallt.marketplace.service;

import com.tallt.marketplace.dto.PageResponse;
import com.tallt.marketplace.dto.product.ProductVersionRequest;
import com.tallt.marketplace.dto.product.ProductVersionResponse;
import com.tallt.marketplace.dto.product.UpdateVersionRequest;
import com.tallt.marketplace.entity.Product;
import com.tallt.marketplace.entity.ProductVersion;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.repository.OrderRepository;
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
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class ProductVersionService {

    private static final Pattern SEMVER_PATTERN = Pattern.compile("^\\d+\\.\\d+\\.\\d+$");

    @Autowired
    private ProductVersionRepository productVersionRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private OrderRepository orderRepository;

    /**
     * Tạo phiên bản mới cho sản phẩm
     * - Kiểm tra sản phẩm tồn tại & Vendor là chủ sở hữu
     * - Validate semver format
     * - Kiểm tra trùng version number
     * - Insert vào ProductVersions
     */
    @Transactional
    public ProductVersionResponse createVersion(Integer vendorId, Integer productId, ProductVersionRequest request) {
        Product product = validateProductOwnership(vendorId, productId);

        // Validate semantic version format
        validateSemver(request.getVersionNumber());

        // Check duplicate version number
        if (productVersionRepository.existsByProduct_ProductIDAndVersionNumber(productId, request.getVersionNumber())) {
            throw new AppException("Phiên bản " + request.getVersionNumber() + " đã tồn tại cho sản phẩm này");
        }

        ProductVersion version = new ProductVersion();
        version.setProduct(product);
        version.setVersionNumber(request.getVersionNumber());
        version.setFileUrl(request.getFileUrl());
        version.setReleaseNotes(request.getReleaseNotes());
        productVersionRepository.save(version);

        // UC13: Gửi email thông báo cho tất cả buyer
        notifyBuyersOfNewVersion(product, version);

        return toResponse(version);
    }

    /**
     * Cập nhật phiên bản sản phẩm
     */
    @Transactional
    public ProductVersionResponse updateVersion(Integer vendorId, Integer productId,
                                                 Integer versionId, UpdateVersionRequest request) {
        Product product = validateProductOwnership(vendorId, productId);

        ProductVersion version = productVersionRepository.findById(versionId)
                .orElseThrow(() -> new AppException("Phiên bản không tồn tại"));

        if (!version.getProduct().getProductID().equals(productId)) {
            throw new AppException("Phiên bản không thuộc sản phẩm này");
        }

        // Update version number if provided
        if (request.getVersionNumber() != null && !request.getVersionNumber().isBlank()) {
            validateSemver(request.getVersionNumber());

            // Check duplicate (exclude current version)
            if (productVersionRepository.existsByProduct_ProductIDAndVersionNumberAndVersionIDNot(
                    productId, request.getVersionNumber(), versionId)) {
                throw new AppException("Phiên bản " + request.getVersionNumber() + " đã tồn tại cho sản phẩm này");
            }
            version.setVersionNumber(request.getVersionNumber());
        }

        // Update file URL if provided
        if (request.getFileUrl() != null && !request.getFileUrl().isBlank()) {
            version.setFileUrl(request.getFileUrl());
        }

        // Update release notes (allow empty)
        if (request.getReleaseNotes() != null) {
            version.setReleaseNotes(request.getReleaseNotes());
        }

        productVersionRepository.save(version);
        return toResponse(version);
    }

    /**
     * Lấy chi tiết một phiên bản
     */
    public ProductVersionResponse getVersionById(Integer vendorId, Integer productId, Integer versionId) {
        validateProductOwnership(vendorId, productId);

        ProductVersion version = productVersionRepository.findById(versionId)
                .orElseThrow(() -> new AppException("Phiên bản không tồn tại"));

        if (!version.getProduct().getProductID().equals(productId)) {
            throw new AppException("Phiên bản không thuộc sản phẩm này");
        }

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

    private void validateSemver(String versionNumber) {
        if (versionNumber == null || !SEMVER_PATTERN.matcher(versionNumber).matches()) {
            throw new AppException("Số phiên bản phải theo định dạng x.y.z (ví dụ: 1.0.0)");
        }
    }

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
        response.setScanStatus(version.getScanStatus());
        response.setCreatedAt(version.getCreatedAt());
        return response;
    }

    /**
     * UC13: Gửi email thông báo bản cập nhật mới cho tất cả Customer đã mua sản phẩm.
     */
    private void notifyBuyersOfNewVersion(Product product, ProductVersion version) {
        try {
            List<String> emails = orderRepository
                    .findBuyerEmailsByProductId(product.getProductID());

            if (emails.isEmpty()) return;

            String subject = "Bản cập nhật mới: " + product.getProductName()
                    + " v" + version.getVersionNumber();

            String body = "Xin chào,\n\n"
                    + "Sản phẩm '" + product.getProductName()
                    + "' mà bạn đã mua vừa có phiên bản mới:\n\n"
                    + "Phiên bản: " + version.getVersionNumber() + "\n"
                    + "Ghi chú: " + (version.getReleaseNotes() != null
                            ? version.getReleaseNotes() : "Không có")
                    + "\n\nTruy cập hệ thống để tải bản cập nhật.\n\n"
                    + "Trân trọng,\nTALLT Marketplace";

            for (String email : emails) {
                try {
                    emailService.sendEmail(email, subject, body);
                } catch (Exception ignored) {
                }
            }
        } catch (Exception ignored) {
        }
    }
}
