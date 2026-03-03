package com.tallt.marketplace.service;

import com.tallt.marketplace.dto.AdminProductReviewDTO;
import com.tallt.marketplace.entity.Product;
import com.tallt.marketplace.entity.ProductVersion;
import com.tallt.marketplace.repository.ProductRepository;
import com.tallt.marketplace.repository.ProductVersionRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminReviewService {

    private final ProductRepository productRepository;
    private final ProductVersionRepository versionRepository;
    private final VirusTotalService virusTotalService;

    public Page<AdminProductReviewDTO> getAllProductsForReview(
            String status,
            String keyword,
            Pageable pageable) {

        Page<Product> productPage;

        // ==== FILTER LOGIC ====
        if (status != null && !status.isEmpty()
                && keyword != null && !keyword.isEmpty()) {

            List<ProductVersion> versions =
                    versionRepository.findByProduct_ProductID(product.getProductID(), null).getContent();
            productPage = productRepository
                    .findByStatusAndProductNameContainingIgnoreCase(
                            status, keyword, pageable);

        } else if (status != null && !status.isEmpty()) {

            productPage = productRepository
                    .findByStatus(status, pageable);

        } else if (keyword != null && !keyword.isEmpty()) {

            return new AdminProductReviewDTO(
                    product.getProductID(),
                    product.getProductName(),
                    product.getVendorID(),
                    product.getBasePrice() != null ? product.getBasePrice().doubleValue() : null,
                    scanStatus,
                    product.getStatus().name(),
                    product.getRejectionNote()
            );

        } else {
            productPage = productRepository.findAll(pageable);
        }

        // ==== MAP DTO ====
        List<AdminProductReviewDTO> dtoList = productPage.getContent()
                .stream()
                .map(product -> {

                    List<ProductVersion> versions = versionRepository.findByProductID(product.getProductID());

                    String scanStatus = "PENDING";

                    if (versions != null && !versions.isEmpty()) {
                        ProductVersion latest = versions.stream()
                                .max(Comparator.comparing(ProductVersion::getCreatedAt))
                                .orElse(null);

                        if (latest != null && latest.getScanStatus() != null) {
                            scanStatus = latest.getScanStatus();
                        }
                    }

                    return new AdminProductReviewDTO(
                            product.getProductID(),
                            product.getProductName(),
                            product.getVendorID(),
                            product.getBasePrice() != null
                                    ? product.getBasePrice().doubleValue()
                                    : null,
                            scanStatus,
                            product.getStatus(),
                            product.getRejectionNote());

                }).toList();

        return new PageImpl<>(
                dtoList,
                pageable,
                productPage.getTotalElements());
    }

    @Transactional
    public String reviewProduct(Integer productId) {

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        List<ProductVersion> versions =
                versionRepository.findByProduct_ProductID(productId, null).getContent();

        if (versions == null || versions.isEmpty()) {
            throw new RuntimeException("No version uploaded");
        }

        ProductVersion latestVersion = versions.stream()
                .max(Comparator.comparing(ProductVersion::getCreatedAt))
                .orElseThrow(() -> new RuntimeException("Cannot find latest version"));

        // ===== CALL VIRUSTOTAL =====
        boolean isMalicious = virusTotalService
                .isFileMalicious(latestVersion.getFileUrl());

        if (isMalicious) {

            // Update version
            latestVersion.setScanStatus("MALICIOUS");
            versionRepository.save(latestVersion);

            // Update product
            product.setStatus(Product.ProductStatus.REJECTED);
            product.setRejectionNote("Detected malware by VirusTotal");
            productRepository.save(product);

            return "Product rejected due to malware.";
        }

        // CLEAN
        latestVersion.setScanStatus("CLEAN");
        versionRepository.save(latestVersion);

        product.setStatus(Product.ProductStatus.APPROVED);
        product.setRejectionNote(null);
        productRepository.save(product);

        return "Product approved successfully.";
    }
}