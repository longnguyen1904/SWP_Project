package com.tallt.marketplace.service;

import com.tallt.marketplace.dto.AdminProductReviewDTO;
import com.tallt.marketplace.entity.Product;
import com.tallt.marketplace.entity.ProductVersion;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.repository.ProductRepository;
import com.tallt.marketplace.repository.ProductVersionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
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

        boolean hasStatus = status != null && !status.isBlank();
        boolean hasKeyword = keyword != null && !keyword.isBlank();

        if (hasStatus && hasKeyword) {
            productPage = productRepository
                    .findByStatusAndProductNameContainingIgnoreCase(status, keyword, pageable);
        } else if (hasStatus) {
            productPage = productRepository.findByStatus(status, pageable);
        } else if (hasKeyword) {
            productPage = productRepository.findByProductNameContainingIgnoreCase(keyword, pageable);
        } else {
            productPage = productRepository.findAll(pageable);
        }

        List<AdminProductReviewDTO> dtoList = productPage.getContent()
                .stream()
                .map(product -> {
                    List<ProductVersion> versions = versionRepository
                            .findByProduct_ProductID(product.getProductID(), Pageable.unpaged())
                            .getContent();

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
                            product.getBasePrice() != null ? product.getBasePrice().doubleValue() : null,
                            scanStatus,
                            product.getStatus() != null ? product.getStatus().name() : null,
                            product.getRejectionNote());
                }).toList();

        return new PageImpl<>(dtoList, pageable, productPage.getTotalElements());
    }

    @Transactional
    public String reviewProduct(Integer productId) {

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException("Product not found: " + productId));

        List<ProductVersion> versions = versionRepository
                .findByProduct_ProductID(productId, Pageable.unpaged())
                .getContent();

        if (versions.isEmpty()) {
            throw new AppException("No version uploaded for product: " + productId);
        }

        ProductVersion latestVersion = versions.stream()
                .max(Comparator.comparing(ProductVersion::getCreatedAt))
                .orElseThrow(() -> new AppException("Cannot find latest version for product: " + productId));

        boolean isMalicious;
        try {
            isMalicious = virusTotalService.isFileMalicious(latestVersion.getFileUrl());
        } catch (Exception e) {
            throw new AppException("Scan failed: " + e.getMessage());
        }

        if (isMalicious) {
            latestVersion.setScanStatus("MALICIOUS");
            versionRepository.save(latestVersion);

            product.setStatus(Product.ProductStatus.REJECTED);
            product.setRejectionNote("Detected malware by VirusTotal");
            productRepository.save(product);

            return "Product rejected due to malware.";
        }

        latestVersion.setScanStatus("CLEAN");
        versionRepository.save(latestVersion);

        product.setStatus(Product.ProductStatus.APPROVED);
        product.setRejectionNote(null);
        productRepository.save(product);

        return "Product approved successfully.";
    }
}
