package com.tallt.marketplace.service;

import com.tallt.marketplace.dto.PageResponse;
import com.tallt.marketplace.dto.product.*;
import com.tallt.marketplace.dto.review.ReviewResponse;
import com.tallt.marketplace.entity.*;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private TagRepository tagRepository;

    @Autowired
    private ProductTagRepository productTagRepository;

    @Autowired
    private ProductImageRepository productImageRepository;

    @Autowired
    private ProductVersionRepository productVersionRepository;

    @Autowired
    private LicenseTierRepository licenseTierRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private EmailService emailService;

    /**
     * Tạo sản phẩm mới cho Vendor
     * - Insert vào Products (IsApproved=0)
     * - Insert tags vào Tags (nếu chưa tồn tại)
     * - Insert mapping vào ProductTags
     */
    @Transactional
    public Map<String, Object> createProduct(Integer vendorId, CreateProductRequest request) {
        // 1. Kiểm tra Vendor tồn tại
        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new AppException("Vendor không tồn tại"));

        // 2. Kiểm tra Vendor đã verified
        if (!vendor.getIsVerified()) {
            throw new AppException("Vendor chưa được xác thực, không thể tạo sản phẩm");
        }

        // 3. Kiểm tra Category tồn tại
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new AppException("Danh mục không tồn tại"));

        // 4. Tạo Product
        Product product = new Product();
        product.setVendor(vendor);
        product.setCategory(category);
        product.setProductName(request.getProductName());
        product.setDescription(request.getDescription());
        product.setBasePrice(request.getBasePrice());
        product.setStatus(Product.ProductStatus.DRAFT);
        product.setHasTrial(request.getHasTrial() != null ? request.getHasTrial() : false);
        product.setTrialDurationDays(request.getTrialDurationDays() != null ? request.getTrialDurationDays() : 7);
        productRepository.save(product);

        // 5. Xử lý Tags
        if (request.getTags() != null && !request.getTags().isEmpty()) {
            for (String tagName : request.getTags()) {
                // Tìm hoặc tạo Tag
                Tag tag = tagRepository.findByTagName(tagName.trim().toLowerCase())
                        .orElseGet(() -> {
                            Tag newTag = new Tag();
                            newTag.setTagName(tagName.trim().toLowerCase());
                            return tagRepository.save(newTag);
                        });

                // Tạo mapping ProductTag
                ProductTag productTag = new ProductTag();
                productTag.setProductID(product.getProductID());
                productTag.setTagID(tag.getTagID());
                productTagRepository.save(productTag);
            }
        }

        return Map.of(
                "productId", product.getProductID(),
                "status", "DRAFT"
        );
    }

    /**
     * Upload ảnh sản phẩm
     */
    @Transactional
    public Map<String, Object> uploadProductImage(Integer vendorId, Integer productId, ProductImageRequest request) {
        Product product = getProductAndValidateOwner(vendorId, productId);

        ProductImage image = new ProductImage();
        image.setProduct(product);
        image.setImageUrl(request.getImageUrl());
        image.setIsPrimary(request.getIsPrimary() != null ? request.getIsPrimary() : false);
        image.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        image.setImageType(request.getImageType() != null ? request.getImageType() : "SCREENSHOT");
        productImageRepository.save(image);

        return Map.of(
                "imageId", image.getImageID(),
                "message", "Ảnh sản phẩm đã được upload thành công"
        );
    }

    /**
     * Cập nhật thông tin sản phẩm
     * - Chỉ cho update khi Product chưa Approved
     * - Vendor phải là chủ sở hữu
     */
    @Transactional
    public ProductResponse updateProduct(Integer vendorId, Integer productId, UpdateProductRequest request) {
        Product product = getProductAndValidateOwner(vendorId, productId);

        // Chỉ cho update khi chưa Approved
        if (product.getStatus() == Product.ProductStatus.APPROVED) {
            throw new AppException("Không thể cập nhật sản phẩm đã được duyệt");
        }

        if (request.getProductName() != null) {
            product.setProductName(request.getProductName());
        }
        if (request.getDescription() != null) {
            product.setDescription(request.getDescription());
        }
        if (request.getBasePrice() != null) {
            product.setBasePrice(request.getBasePrice());
        }
        productRepository.save(product);

        return toProductResponse(product);
    }

    /**
     * Submit sản phẩm để Admin duyệt
     * - Validate: có ít nhất 1 version, có ít nhất 1 license tier
     * - Đánh dấu chờ duyệt (IsApproved=0)
     */
    @Transactional
    public Map<String, Object> submitForApproval(Integer vendorId, Integer productId) {
        Product product = getProductAndValidateOwner(vendorId, productId);

        if (product.getStatus() == Product.ProductStatus.APPROVED) {
            throw new AppException("Sản phẩm đã được duyệt trước đó");
        }

        if (product.getStatus() == Product.ProductStatus.PENDING) {
            throw new AppException("Sản phẩm đang chờ duyệt");
        }

        // Kiểm tra có ít nhất 1 version
        long versionCount = productVersionRepository.countByProduct_ProductID(productId);
        if (versionCount == 0) {
            throw new AppException("Sản phẩm phải có ít nhất 1 phiên bản trước khi submit");
        }

        // Kiểm tra có ít nhất 1 license tier
        long tierCount = licenseTierRepository.countByProduct_ProductID(productId);
        if (tierCount == 0) {
            throw new AppException("Sản phẩm phải có ít nhất 1 license tier trước khi submit");
        }

        product.setStatus(Product.ProductStatus.PENDING);
        productRepository.save(product);

        return Map.of(
                "productId", product.getProductID(),
                "status", "PENDING",
                "message", "Sản phẩm đã được gửi để duyệt"
        );
    }

    /**
     * Admin duyệt/từ chối sản phẩm
     * - status: APPROVED hoặc REJECTED
     * - note: lý do từ chối (nếu REJECTED)
     */
    @Transactional
    public Map<String, Object> reviewProduct(Integer productId, String status, String note) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException("Sản phẩm không tồn tại"));

        if (product.getStatus() == Product.ProductStatus.APPROVED) {
            throw new AppException("Sản phẩm đã được duyệt trước đó");
        }

        Product.ProductStatus newStatus;
        try {
            newStatus = Product.ProductStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new AppException("Trạng thái không hợp lệ. Chỉ chấp nhận: APPROVED hoặc REJECTED");
        }

        if (newStatus != Product.ProductStatus.APPROVED && newStatus != Product.ProductStatus.REJECTED) {
            throw new AppException("Trạng thái không hợp lệ. Chỉ chấp nhận: APPROVED hoặc REJECTED");
        }

        product.setStatus(newStatus);
        if (newStatus == Product.ProductStatus.REJECTED) {
            product.setRejectionNote(note);
        }
        productRepository.save(product);

        if (newStatus == Product.ProductStatus.APPROVED) {
            try {
                String to = product.getVendor() != null && product.getVendor().getUser() != null
                        ? product.getVendor().getUser().getEmail()
                        : null;
                String subject = "Sản phẩm đã được duyệt";
                String body = "Sản phẩm '" + product.getProductName() + "' đã được Admin duyệt và hiển thị trên marketplace.";
                emailService.sendEmail(to, subject, body);
            } catch (Exception ignored) {
            }
        }

        return Map.of(
                "productId", product.getProductID(),
                "status", product.getStatus().name(),
                "message", newStatus == Product.ProductStatus.APPROVED
                        ? "Sản phẩm đã được duyệt thành công"
                        : "Sản phẩm đã bị từ chối"
        );
    }

    /**
     * Lấy danh sách sản phẩm của Vendor với filter, search, paging, sort
     */
    public PageResponse<ProductResponse> getVendorProducts(Integer vendorId, String search,
                                                            Integer categoryId, String status,
                                                            int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Product.ProductStatus productStatus = null;
        if (status != null && !status.isBlank()) {
            try {
                productStatus = Product.ProductStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new AppException("Trạng thái sản phẩm không hợp lệ. Chỉ chấp nhận: DRAFT, PENDING, APPROVED, REJECTED");
            }
        }

        Page<Product> productPage = productRepository.findByVendorWithFilters(
                vendorId, search, categoryId, productStatus, pageable);

        List<ProductResponse> responses = productPage.getContent().stream()
                .map(this::toProductResponse)
                .collect(Collectors.toList());

        PageResponse<ProductResponse> response = new PageResponse<>();
        response.setContent(responses);
        response.setPage(productPage.getNumber());
        response.setSize(productPage.getSize());
        response.setTotalElements(productPage.getTotalElements());
        response.setTotalPages(productPage.getTotalPages());
        response.setLast(productPage.isLast());
        return response;
    }

    /**
     * UC24 - Vendor Shop Page: list sản phẩm public theo vendor
     */
    public PageResponse<ProductResponse> getVendorStorefrontProducts(Integer vendorId,
                                                                     String search,
                                                                     Integer categoryId,
                                                                     Boolean hasTrial,
                                                                     java.math.BigDecimal minPrice,
                                                                     java.math.BigDecimal maxPrice,
                                                                     String tag,
                                                                     int page, int size,
                                                                     String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        String normalizedTag = (tag != null && !tag.isBlank()) ? tag.trim().toLowerCase() : null;
        Page<Product> productPage = productRepository.findApprovedByVendorStorefront(
                vendorId,
                (search != null && !search.isBlank()) ? search.trim() : null,
                categoryId,
                hasTrial,
                minPrice,
                maxPrice,
                normalizedTag,
                pageable
        );

        List<ProductResponse> responses = productPage.getContent().stream()
                .map(this::toProductResponse)
                .collect(Collectors.toList());

        PageResponse<ProductResponse> response = new PageResponse<>();
        response.setContent(responses);
        response.setPage(productPage.getNumber());
        response.setSize(productPage.getSize());
        response.setTotalElements(productPage.getTotalElements());
        response.setTotalPages(productPage.getTotalPages());
        response.setLast(productPage.isLast());
        return response;
    }

    /**
     * Lấy tất cả sản phẩm (Admin) với filter, search, paging, sort
     */
    public PageResponse<ProductResponse> getAllProducts(String search, Integer categoryId,
                                                        String status, Integer vendorId,
                                                        int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Product.ProductStatus productStatus = null;
        if (status != null && !status.isBlank()) {
            try {
                productStatus = Product.ProductStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new AppException("Trạng thái sản phẩm không hợp lệ. Chỉ chấp nhận: DRAFT, PENDING, APPROVED, REJECTED");
            }
        }

        Page<Product> productPage = productRepository.findAllWithFilters(
                search, categoryId, productStatus, vendorId, pageable);

        List<ProductResponse> responses = productPage.getContent().stream()
                .map(this::toProductResponse)
                .collect(Collectors.toList());

        PageResponse<ProductResponse> response = new PageResponse<>();
        response.setContent(responses);
        response.setPage(productPage.getNumber());
        response.setSize(productPage.getSize());
        response.setTotalElements(productPage.getTotalElements());
        response.setTotalPages(productPage.getTotalPages());
        response.setLast(productPage.isLast());
        return response;
    }

    /**
     * Lấy chi tiết sản phẩm theo ID
     */
    public ProductResponse getProductById(Integer productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException("Sản phẩm không tồn tại"));
        return toProductResponse(product);
    }

    /**
     * UC11 - Marketplace Storefront: list sản phẩm public đã được duyệt
     */
    public PageResponse<ProductResponse> getStorefrontProducts(String search,
                                                               Integer categoryId,
                                                               Boolean hasTrial,
                                                               java.math.BigDecimal minPrice,
                                                               java.math.BigDecimal maxPrice,
                                                               String tag,
                                                               int page, int size,
                                                               String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        String normalizedTag = (tag != null && !tag.isBlank()) ? tag.trim().toLowerCase() : null;
        Page<Product> productPage = productRepository.findApprovedStorefront(
                (search != null && !search.isBlank()) ? search.trim() : null,
                categoryId,
                hasTrial,
                minPrice,
                maxPrice,
                normalizedTag,
                pageable
        );

        List<ProductResponse> responses = productPage.getContent().stream()
                .map(this::toProductResponse)
                .collect(Collectors.toList());

        PageResponse<ProductResponse> response = new PageResponse<>();
        response.setContent(responses);
        response.setPage(productPage.getNumber());
        response.setSize(productPage.getSize());
        response.setTotalElements(productPage.getTotalElements());
        response.setTotalPages(productPage.getTotalPages());
        response.setLast(productPage.isLast());
        return response;
    }

    /**
     * UC12 - Product detail page: chi tiết sản phẩm public
     */
    public ProductDetailResponse getPublicProductDetail(Integer productId, int relatedSize) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException("Sản phẩm không tồn tại"));

        if (product.getStatus() != Product.ProductStatus.APPROVED) {
            throw new AppException("Sản phẩm chưa được duyệt");
        }

        ProductDetailResponse response = new ProductDetailResponse();
        response.setProduct(toProductResponse(product));

        // Images
        List<ProductImage> images = productImageRepository.findByProduct_ProductIDOrderBySortOrderAsc(productId);
        List<ProductImageResponse> imageResponses = images.stream().map(img -> {
            ProductImageResponse r = new ProductImageResponse();
            r.setImageId(img.getImageID());
            r.setImageUrl(img.getImageUrl());
            r.setImageType(img.getImageType());
            r.setSortOrder(img.getSortOrder());
            r.setIsPrimary(img.getIsPrimary());
            r.setCreatedAt(img.getCreatedAt());
            return r;
        }).collect(Collectors.toList());
        response.setImages(imageResponses);

        // Latest Version
        productVersionRepository.findTopByProduct_ProductIDOrderByCreatedAtDesc(productId)
                .ifPresent(v -> {
                    ProductVersionResponse vr = new ProductVersionResponse();
                    vr.setVersionId(v.getVersionID());
                    vr.setProductId(productId);
                    vr.setVersionNumber(v.getVersionNumber());
                    vr.setFileUrl(v.getFileUrl());
                    vr.setReleaseNotes(v.getReleaseNotes());
                    vr.setCreatedAt(v.getCreatedAt());
                    response.setLatestVersion(vr);
                });

        // License tiers (return all tiers of product)
        List<LicenseTier> tiers = licenseTierRepository.findByProduct_ProductID(productId, Pageable.unpaged()).getContent();
        response.setLicenseTiers(tiers.stream().map(t -> {
            com.tallt.marketplace.dto.licensetier.LicenseTierResponse tr = new com.tallt.marketplace.dto.licensetier.LicenseTierResponse();
            tr.setTierId(t.getTierID());
            tr.setProductId(productId);
            tr.setTierName(t.getTierName());
            tr.setPrice(t.getPrice());
            tr.setMaxDevices(t.getMaxDevices());
            tr.setDurationDays(t.getDurationDays());
            tr.setContent(t.getContent());
            tr.setTierCode(t.getTierCode());
            return tr;
        }).collect(Collectors.toList()));

        // Rating summary
        Double avg = reviewRepository.getAverageRating(productId);
        long count = reviewRepository.countByProduct_ProductID(productId);
        response.setAverageRating(avg != null ? avg : 0.0);
        response.setReviewCount(count);

        // Related products (ưu tiên tag trùng + cùng category, tie-break bằng rating)
        int size = Math.max(0, relatedSize);
        if (size == 0) {
            response.setRelatedProducts(List.of());
            return response;
        }

        List<Integer> tagIds = productTagRepository.findTagIdsByProductId(productId);
        List<ProductResponse> related;
        if (tagIds != null && !tagIds.isEmpty()) {
            related = productRepository
                    .findRelatedApprovedByTags(product.getCategory().getCategoryID(), productId, tagIds, PageRequest.of(0, size))
                    .getContent()
                    .stream()
                    .map(row -> (Product) row[0])
                    .map(this::toProductResponse)
                    .collect(Collectors.toList());
        } else {
            // Fallback: không có tag -> lấy theo category
            related = productRepository
                    .findRelatedApproved(product.getCategory().getCategoryID(), productId, PageRequest.of(0, size))
                    .getContent()
                    .stream()
                    .map(this::toProductResponse)
                    .collect(Collectors.toList());
        }
        response.setRelatedProducts(related);

        return response;
    }

    /**
     * UC12 - Reviews (paging)
     */
    public PageResponse<ReviewResponse> getProductReviews(Integer productId,
                                                          int page, int size,
                                                          String sortBy, String sortDir) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException("Sản phẩm không tồn tại"));
        if (product.getStatus() != Product.ProductStatus.APPROVED) {
            throw new AppException("Sản phẩm chưa được duyệt");
        }

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Review> reviewPage = reviewRepository.findByProduct_ProductID(productId, pageable);
        List<ReviewResponse> content = reviewPage.getContent().stream().map(r -> {
            ReviewResponse rr = new ReviewResponse();
            rr.setReviewId(r.getReviewID());
            rr.setUserId(r.getUser().getUserID());
            rr.setFullName(r.getUser().getFullName());
            rr.setRating(r.getRating());
            rr.setComment(r.getComment());
            rr.setCreatedAt(r.getCreatedAt());
            return rr;
        }).collect(Collectors.toList());

        PageResponse<ReviewResponse> response = new PageResponse<>();
        response.setContent(content);
        response.setPage(reviewPage.getNumber());
        response.setSize(reviewPage.getSize());
        response.setTotalElements(reviewPage.getTotalElements());
        response.setTotalPages(reviewPage.getTotalPages());
        response.setLast(reviewPage.isLast());
        return response;
    }

    // ==================== HELPER METHODS ====================

    /**
     * Kiểm tra sản phẩm tồn tại & Vendor là chủ sở hữu
     */
    private Product getProductAndValidateOwner(Integer vendorId, Integer productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException("Sản phẩm không tồn tại"));

        if (!product.getVendor().getVendorID().equals(vendorId)) {
            throw new AppException("Bạn không có quyền thao tác trên sản phẩm này");
        }
        return product;
    }

    /**
     * Chuyển đổi Product entity sang ProductResponse DTO
     */
    private ProductResponse toProductResponse(Product product) {
        ProductResponse response = new ProductResponse();
        response.setProductId(product.getProductID());
        response.setProductName(product.getProductName());
        response.setCategoryName(product.getCategory().getCategoryName());
        response.setCategoryId(product.getCategory().getCategoryID());
        response.setDescription(product.getDescription());
        response.setBasePrice(product.getBasePrice());
        response.setIsApproved(product.getIsApproved());
        response.setHasTrial(product.getHasTrial());
        response.setTrialDurationDays(product.getTrialDurationDays());
        response.setVendorName(product.getVendor().getCompanyName() != null
                ? product.getVendor().getCompanyName()
                : product.getVendor().getUser().getFullName());
        response.setVendorId(product.getVendor().getVendorID());
        response.setCreatedAt(product.getCreatedAt());

        // Lấy tags
        List<ProductTag> productTags = productTagRepository.findByProductID(product.getProductID());
        List<String> tags = new ArrayList<>();
        for (ProductTag pt : productTags) {
            if (pt.getTag() != null) {
                tags.add(pt.getTag().getTagName());
            }
        }
        response.setTags(tags);

        // Xác định status
        response.setStatus(product.getStatus().name());

        return response;
    }
}
