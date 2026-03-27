package com.tallt.marketplace.service;

import com.tallt.marketplace.dto.admin.AdminProductReviewDTO;
import com.tallt.marketplace.entity.Product;
import com.tallt.marketplace.entity.ProductVersion;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.repository.ProductRepository;
import com.tallt.marketplace.repository.ProductVersionRepository;
import com.tallt.marketplace.repository.VendorFollowerRepository;
import com.tallt.marketplace.entity.VendorFollower;
import org.springframework.beans.factory.annotation.Value;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminReviewService {

    private final ProductRepository productRepository;
    private final ProductVersionRepository versionRepository;
    private final VirusTotalService virusTotalService;
    private final EmailService emailService;
    private final VendorFollowerRepository followerRepository;

    @Value("${frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;


    public Page<AdminProductReviewDTO> getAllProductsForReview(
            String status,
            String keyword,
            Pageable pageable) {

        Product.ProductStatus statusEnum = parseStatus(status);

        Page<Product> productPage = queryProducts(statusEnum, keyword, pageable);

        List<AdminProductReviewDTO> dtoList = productPage.getContent().stream()
                .map(this::toAdminProductReviewDTO)
                .toList();

        return new PageImpl<>(dtoList, pageable, productPage.getTotalElements());
    }


    @Transactional
    public String reviewProduct(Integer productId) {

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException("Product not found: " + productId));

        // Lấy version MỚI NHẤT (bất kể scan status)
        ProductVersion latestVersion = versionRepository
                .findTopByProduct_ProductIDOrderByCreatedAtDesc(productId)
                .orElseThrow(() -> new AppException("No version uploaded for product: " + productId));

        // Guard: nếu version mới nhất đã được scan và product đã APPROVED/REJECTED
        // → chỉ re-scan nếu version đó vẫn đang PENDING
        if ("CLEAN".equals(latestVersion.getScanStatus())
                && product.getStatus() == Product.ProductStatus.APPROVED) {
            return "Product is already approved and the latest version is clean. No re-scan needed.";
        }

        if (latestVersion.getFileUrl() == null || latestVersion.getFileUrl().isBlank()) {
            throw new AppException("Download URL is empty for version: " + latestVersion.getVersionID());
        }

        log.info("[AdminReview] Scanning productId={}, versionId={}, url={}",
                productId, latestVersion.getVersionID(), latestVersion.getFileUrl());

        boolean isMalicious = virusTotalService.isUrlMalicious(latestVersion.getFileUrl());

        if (isMalicious) {
            latestVersion.setScanStatus("MALICIOUS");
            versionRepository.save(latestVersion);

            product.setStatus(Product.ProductStatus.REJECTED);
            product.setRejectionNote("Detected malware by VirusTotal (URL Scan)");
            productRepository.save(product);

            log.warn("[AdminReview] Product {} REJECTED - malicious URL detected", productId);
            return "Product rejected due to malicious download link.";
        }

        latestVersion.setScanStatus("CLEAN");
        versionRepository.save(latestVersion);

        product.setStatus(Product.ProductStatus.APPROVED);
        product.setRejectionNote(null);
        productRepository.save(product);

        log.info("[AdminReview] Product {} APPROVED successfully", productId);

        notifyFollowersOfNewProduct(product);

        return "Product approved successfully.";
    }


    private static final List<Product.ProductStatus> REVIEWABLE_STATUSES = List.of(
            Product.ProductStatus.PENDING,
            Product.ProductStatus.APPROVED,
            Product.ProductStatus.REJECTED
    );


    private Product.ProductStatus parseStatus(String status) {
        if (status == null || status.isBlank()) return null;
        try {
            Product.ProductStatus parsed = Product.ProductStatus.valueOf(status.toUpperCase());
            if (parsed == Product.ProductStatus.DRAFT) {
                throw new AppException("Status DRAFT is not allowed in review list.");
            }
            return parsed;
        } catch (IllegalArgumentException e) {
            throw new AppException("Invalid status value: " + status);
        }
    }

 
    private Page<Product> queryProducts(Product.ProductStatus statusEnum, String keyword, Pageable pageable) {
        boolean hasStatus = statusEnum != null;
        boolean hasKeyword = keyword != null && !keyword.isBlank();

        if (hasStatus && hasKeyword) {
            return productRepository.findByStatusAndProductNameContainingIgnoreCase(statusEnum, keyword, pageable);
        } else if (hasStatus) {
            return productRepository.findByStatus(statusEnum, pageable);
        } else if (hasKeyword) {
            return productRepository.findByStatusInAndProductNameContainingIgnoreCase(REVIEWABLE_STATUSES, keyword, pageable);
        } else {
            return productRepository.findByStatusIn(REVIEWABLE_STATUSES, pageable);
        }
    }


    private AdminProductReviewDTO toAdminProductReviewDTO(Product product) {
        // Lấy version MỚI NHẤT theo thời gian tạo
        Optional<ProductVersion> latestOpt = versionRepository
                .findTopByProduct_ProductIDOrderByCreatedAtDesc(product.getProductID());

        String scanStatus = latestOpt
                .map(ProductVersion::getScanStatus)
                .orElse("PENDING");

        // fileUrl chỉ expose khi version mới nhất là CLEAN và product đang APPROVED
        String fileUrl = latestOpt
                .filter(v -> "CLEAN".equals(v.getScanStatus())
                        && product.getStatus() == Product.ProductStatus.APPROVED)
                .map(ProductVersion::getFileUrl)
                .orElse(null);

        return new AdminProductReviewDTO(
                product.getProductID(),
                product.getProductName(),
                product.getVendor() != null ? product.getVendor().getVendorID() : null,
                product.getBasePrice() != null ? product.getBasePrice().doubleValue() : null,
                scanStatus,
                product.getStatus().name(),
                product.getRejectionNote(),
                fileUrl);
    }

    /**
     * Gửi email thông báo đến tất cả followers của vendor khi product được approve.
     */
    private void notifyFollowersOfNewProduct(Product product) {
        if (product.getVendor() == null) return;

        List<VendorFollower> followers = followerRepository
                .findByVendor_VendorID(product.getVendor().getVendorID());
        if (followers.isEmpty()) return;

        String vendorName = Optional.ofNullable(product.getVendor().getCompanyName())
                .orElse("A Vendor");
        String productUrl = frontendBaseUrl + "/products/" + product.getProductID();

        String subject = "New Product from " + vendorName + "!";
        String title = "New Product Available";
        String body = "<p>Hello,</p>"
                + "<p>Vendor <strong>" + vendorName
                + "</strong> that you follow has published a new product: "
                + "<strong>" + product.getProductName() + "</strong>.</p>"
                + "<p style='text-align:center;margin:24px 0;'>"
                + "<a href='" + productUrl + "' "
                + "style='display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);"
                + "color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;"
                + "font-size:16px;font-weight:600;'>View Product →</a></p>";

        followers.stream()
                .filter(f -> f.getUser() != null && f.getUser().getEmail() != null)
                .forEach(f -> {
                    try {
                        emailService.sendEmail(f.getUser().getEmail(), subject, title, body);
                    } catch (Exception e) {
                        log.error("[FollowerNotify] Failed to send email to {}: {}",
                                f.getUser().getEmail(), e.getMessage());
                    }
                });
    }
}