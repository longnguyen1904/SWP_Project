package com.tallt.marketplace.service;

import com.tallt.marketplace.dto.admin.AdminProductReviewDTO;
import com.tallt.marketplace.entity.Product;
import com.tallt.marketplace.entity.ProductVersion;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.service.EmailService;
import com.tallt.marketplace.repository.ProductRepository;
import com.tallt.marketplace.repository.ProductVersionRepository;
import com.tallt.marketplace.repository.VendorFollowerRepository;
import com.tallt.marketplace.entity.VendorFollower;
import org.springframework.beans.factory.annotation.Value;
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
        private final EmailService emailService;
        private final VendorFollowerRepository followerRepository;

        @Value("${frontend.base-url:http://localhost:5173}")
        private String frontendBaseUrl;


        public Page<AdminProductReviewDTO> getAllProductsForReview(
                        String status,
                        String keyword,
                        Pageable pageable) {

                Page<Product> productPage;

                Product.ProductStatus statusEnum = null;

                if (status != null && !status.isBlank()) {
                        try {
                                statusEnum = Product.ProductStatus.valueOf(status.toUpperCase());
                        } catch (Exception e) {
                                throw new AppException("Invalid status: " + status);
                        }
                }



                if (statusEnum != null && keyword != null && !keyword.isBlank()) {

                        productPage = productRepository
                                        .findByStatusAndProductNameContainingIgnoreCase(
                                                        statusEnum, keyword, pageable);

                } else if (statusEnum != null) {

                        productPage = productRepository
                                        .findByStatus(statusEnum, pageable);

                } else if (keyword != null && !keyword.isBlank()) {

                        productPage = productRepository
                                        .findByProductNameContainingIgnoreCase(keyword, pageable);

                } else {

                        productPage = productRepository.findAll(pageable);

                }


                List<AdminProductReviewDTO> dtoList = productPage
                                .getContent()
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



        @Transactional
        public String reviewProduct(Integer productId) {

                Product product = productRepository
                                .findById(productId)
                                .orElseThrow(() -> new AppException("Product not found"));

                ProductVersion latestVersion = versionRepository
                                .findTopByProduct_ProductIDOrderByCreatedAtDesc(productId)
                                .orElseThrow(() -> new AppException("No version uploaded"));

                if (latestVersion.getFileUrl() == null ||
                                latestVersion.getFileUrl().isBlank()) {

                        throw new AppException("Download URL is empty");
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



                latestVersion.setScanStatus("CLEAN");
                versionRepository.save(latestVersion);

                product.setStatus(Product.ProductStatus.APPROVED);
                product.setRejectionNote(null);

                productRepository.save(product);

                // Gửi email thông báo cho followers
                notifyFollowersOfNewProduct(product);

                return "Product approved successfully.";
        }

        private void notifyFollowersOfNewProduct(Product product) {
                if (product.getVendor() == null) return;

                List<VendorFollower> followers = followerRepository.findByVendor_VendorID(product.getVendor().getVendorID());
                if (followers.isEmpty()) return;

                String vendorName = product.getVendor().getCompanyName() != null ? product.getVendor().getCompanyName() : "Một Vendor";
                String productUrl = frontendBaseUrl + "/products/" + product.getProductID();

                for (VendorFollower follower : followers) {
                        if (follower.getUser() != null && follower.getUser().getEmail() != null) {
                                String userEmail = follower.getUser().getEmail();
                                String subject = "Sản phẩm mới từ " + vendorName + "!";
                                String body = "<html><body>"
                                                + "<h2>Chào bạn,</h2>"
                                                + "<p>Vendor <strong>" + vendorName + "</strong> mà bạn theo dõi vừa đăng tải sản phẩm mới: <strong>" + product.getProductName() + "</strong>.</p>"
                                                + "<p>Hãy xem ngay tại đây: <a href='" + productUrl + "'>Xem sản phẩm</a></p>"
                                                + "<br><p>Cảm ơn bạn đã đồng hành cùng chúng tôi!</p>"
                                                + "</body></html>";
                                
                                try {
                                        emailService.sendEmail(userEmail, subject, "Sản phẩm mới!", body);
                                        System.out.println("[FollowerNotify] Đã gửi email cho " + userEmail);
                                } catch (Exception e) {
                                        System.err.println("[FollowerNotify] Lỗi gửi email cho " + userEmail + ": " + e.getMessage());
                                }
                        }
                }
        }
}