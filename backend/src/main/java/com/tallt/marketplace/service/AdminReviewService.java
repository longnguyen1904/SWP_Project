package com.tallt.marketplace.service;

import com.tallt.marketplace.dto.AdminProductReviewDTO;
import com.tallt.marketplace.entity.Product;
import com.tallt.marketplace.entity.ProductVersion;
import com.tallt.marketplace.repository.ProductRepository;
import com.tallt.marketplace.repository.ProductVersionRepository;
import lombok.RequiredArgsConstructor;
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

    // =========================
    // LẤY DANH SÁCH REVIEW
    // =========================
    public List<AdminProductReviewDTO> getAllProductsForReview() {

        List<Product> products = productRepository.findAll();

        return products.stream().map(product -> {

            List<ProductVersion> versions =
                    versionRepository.findByProductID(product.getProductID());

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
                    product.getStatus(),
                    product.getRejectionNote()
            );

        }).toList();
    }


    @Transactional
    public String reviewProduct(Integer productId) {

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        List<ProductVersion> versions =
                versionRepository.findByProductID(productId);

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
            product.setStatus("REJECTED");
            product.setRejectionNote("Detected malware by VirusTotal");
            productRepository.save(product);

            return "Product rejected due to malware.";
        }

        // CLEAN
        latestVersion.setScanStatus("CLEAN");
        versionRepository.save(latestVersion);

        product.setStatus("APPROVED");
        product.setRejectionNote(null);
        productRepository.save(product);

        return "Product approved successfully.";
    }
}