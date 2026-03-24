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
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${vnpay.frontend-url:http://localhost:5173}")
    private String frontendBaseUrl;

    /**
     * Create a new version for product
     * - Check product exists & Vendor is the owner
     * - Validate semver format
     * - Check duplicate version number
     * - Insert into ProductVersions
     */
    @Transactional
    public ProductVersionResponse createVersion(Integer vendorId, Integer productId, ProductVersionRequest request) {
        Product product = validateProductOwnership(vendorId, productId);

        // Validate semantic version format
        validateSemver(request.getVersionNumber());

        // Check duplicate version number
        if (productVersionRepository.existsByProduct_ProductIDAndVersionNumber(productId, request.getVersionNumber())) {
            throw new AppException("Version " + request.getVersionNumber() + " already exists for this product");
        }

        ProductVersion version = new ProductVersion();
        version.setProduct(product);
        version.setVersionNumber(request.getVersionNumber());
        version.setFileUrl(request.getFileUrl());
        version.setReleaseNotes(request.getReleaseNotes());
        productVersionRepository.save(version);

        // UC13: Send email notification to all buyers
        notifyBuyersOfNewVersion(product, version);

        return toResponse(version);
    }

    /**
     * Update product version
     */
    @Transactional
    public ProductVersionResponse updateVersion(Integer vendorId, Integer productId,
                                                 Integer versionId, UpdateVersionRequest request) {
        Product product = validateProductOwnership(vendorId, productId);

        ProductVersion version = productVersionRepository.findById(versionId)
                .orElseThrow(() -> new AppException("Version does not exist"));

        if (!version.getProduct().getProductID().equals(productId)) {
            throw new AppException("Version does not belong to this product");
        }

        // Update version number if provided
        if (request.getVersionNumber() != null && !request.getVersionNumber().isBlank()) {
            validateSemver(request.getVersionNumber());

            // Check duplicate (exclude current version)
            if (productVersionRepository.existsByProduct_ProductIDAndVersionNumberAndVersionIDNot(
                    productId, request.getVersionNumber(), versionId)) {
                throw new AppException("Version " + request.getVersionNumber() + " already exists for this product");
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
     * Get version detail
     */
    public ProductVersionResponse getVersionById(Integer vendorId, Integer productId, Integer versionId) {
        validateProductOwnership(vendorId, productId);

        ProductVersion version = productVersionRepository.findById(versionId)
                .orElseThrow(() -> new AppException("Version does not exist"));

        if (!version.getProduct().getProductID().equals(productId)) {
            throw new AppException("Version does not belong to this product");
        }

        return toResponse(version);
    }

    /**
     * Get latest version of product
     * - Order by CreatedAt DESC, return 1 record
     */
    public ProductVersionResponse getLatestVersion(Integer productId) {
        // Check product exists
        if (!productRepository.existsById(productId)) {
            throw new AppException("Product does not exist");
        }

        ProductVersion version = productVersionRepository
                .findTopByProduct_ProductIDOrderByCreatedAtDesc(productId)
                .orElseThrow(() -> new AppException("Product has no versions yet"));

        return toResponse(version);
    }

    /**
     * Get list of product versions with paging, sort
     */
    public PageResponse<ProductVersionResponse> getVersions(Integer productId,
                                                             int page, int size, String sortBy, String sortDir) {
        if (!productRepository.existsById(productId)) {
            throw new AppException("Product does not exist");
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
            throw new AppException("Version number must follow x.y.z format (e.g., 1.0.0)");
        }
    }

    private Product validateProductOwnership(Integer vendorId, Integer productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException("Product does not exist"));

        if (!product.getVendor().getVendorID().equals(vendorId)) {
            throw new AppException("You do not have permission to perform this action on this product");
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
     * UC13: Send email notification about new update to all Customers who purchased the product.
     */
    private void notifyBuyersOfNewVersion(Product product, ProductVersion version) {
        try {
            List<String> emails = orderRepository
                    .findBuyerEmailsByProductId(product.getProductID());

            if (emails.isEmpty()) return;

            String subject = "New Update: " + product.getProductName()
                    + " v" + version.getVersionNumber();

            String title = "Product Update Available";
            String body = "<p>Hello,</p>"
                    + "<p>The product <strong>" + product.getProductName()
                    + "</strong> that you purchased has a new version:</p>"
                    + "<div style='background:#2d3748;border-left:4px solid #667eea;padding:16px 20px;border-radius:6px;margin:16px 0;'>"
                    + "<p style='margin:0 0 8px;color:#e2e8f0;font-size:16px;font-weight:600;'>Version "
                    + version.getVersionNumber() + "</p>"
                    + "<p style='margin:0;color:#a0aec0;'>"
                    + (version.getReleaseNotes() != null ? version.getReleaseNotes() : "No release notes")
                    + "</p></div>"
                    + "<p style='text-align:center;margin:24px 0;'>"
                    + "<a href='" + frontendBaseUrl + "/products/" + product.getProductID() + "' "
                    + "style='display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);"
                    + "color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;"
                    + "font-size:16px;font-weight:600;'>Khám phá ngay →</a></p>";

            for (String email : emails) {
                try {
                    emailService.sendEmail(email, subject, title, body);
                } catch (Exception ignored) {
                }
            }
        } catch (Exception ignored) {
        }
    }
}
