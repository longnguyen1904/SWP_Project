package com.tallt.marketplace.service;

import com.tallt.marketplace.dto.AdminProductReviewDTO;
import com.tallt.marketplace.entity.Product;
import com.tallt.marketplace.entity.ProductVersion;
import com.tallt.marketplace.repository.ProductRepository;
import com.tallt.marketplace.repository.ProductVersionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AdminReviewService {

        private final ProductRepository productRepository;
        private final ProductVersionRepository versionRepository;
        private final VirusTotalService virusTotalService;

        // =========================
        // GET PRODUCTS FOR REVIEW
        // =========================
        public Page<AdminProductReviewDTO> getAllProductsForReview(
                        String status,
                        String keyword,
                        Pageable pageable) {

                Page<Product> productPage;

                // ===== CONVERT STATUS STRING -> ENUM =====
                Product.ProductStatus statusEnum = null;
                if (status != null && !status.isBlank()) {
                        try {
                                statusEnum = Product.ProductStatus.valueOf(status.toUpperCase());
                        } catch (IllegalArgumentException e) {
                                throw new RuntimeException("Invalid status value: " + status);
                        }
                }

                // ===== FILTER LOGIC =====
                if (statusEnum != null && keyword != null && !keyword.isBlank()) {

                        productPage = productRepository
                                        .findByStatusAndProductNameContainingIgnoreCase(
                                                        statusEnum.name(), keyword, pageable);

                } else if (statusEnum != null) {

                        productPage = productRepository
                                        .findByStatus(statusEnum.name(), pageable);

                } else if (keyword != null && !keyword.isBlank()) {

                        productPage = productRepository
                                        .findByProductNameContainingIgnoreCase(keyword, pageable);

                } else {
                        productPage = productRepository.findAll(pageable);
                }

                // ===== MAP DTO =====
                List<AdminProductReviewDTO> dtoList = productPage.getContent()
                                .stream()
                                .map(product -> {

                                        String scanStatus = "PENDING";

                                        Optional<ProductVersion> latestOpt = versionRepository
                                                        .findTopByProduct_ProductIDOrderByCreatedAtDesc(
                                                                        product.getProductID());

                                        if (latestOpt.isPresent()) {
                                                ProductVersion latest = latestOpt.get();
                                                if (latest.getScanStatus() != null) {
                                                        scanStatus = latest.getScanStatus();
                                                }
                                        }

                                        return new AdminProductReviewDTO(
                                                        product.getProductID(),
                                                        product.getProductName(),
                                                        product.getVendor() != null
                                                                        ? product.getVendor().getVendorID()
                                                                        : null,
                                                        product.getBasePrice() != null
                                                                        ? product.getBasePrice().doubleValue()
                                                                        : null,
                                                        scanStatus,
                                                        product.getStatus().name(),
                                                        product.getRejectionNote());
                                })
                                .toList();

                return new PageImpl<>(dtoList, pageable, productPage.getTotalElements());
        }

        // =========================
        // REVIEW PRODUCT (SCAN URL)
        // =========================
        @Transactional
        public String reviewProduct(Integer productId) {

                Product product = productRepository.findById(productId)
                                .orElseThrow(() -> new RuntimeException("Product not found"));

                ProductVersion latestVersion = versionRepository
                                .findTopByProduct_ProductIDOrderByCreatedAtDesc(productId)
                                .orElseThrow(() -> new RuntimeException("No version uploaded"));

                if (latestVersion.getFileUrl() == null
                                || latestVersion.getFileUrl().isBlank()) {
                        throw new RuntimeException("Download URL is empty");
                }

                boolean isMalicious = virusTotalService.isUrlMalicious(latestVersion.getFileUrl());

                if (isMalicious) {

                        latestVersion.setScanStatus("MALICIOUS");
                        versionRepository.save(latestVersion);

                        product.setStatus(Product.ProductStatus.REJECTED);
                        product.setRejectionNote(
                                        "Detected malware by VirusTotal (URL Scan)");
                        productRepository.save(product);

                        return "Product rejected due to malicious download link.";
                }

                // ===== CLEAN =====
                latestVersion.setScanStatus("CLEAN");
                versionRepository.save(latestVersion);

                product.setStatus(Product.ProductStatus.APPROVED);
                product.setRejectionNote(null);
                productRepository.save(product);

                return "Product approved successfully.";
        }
}