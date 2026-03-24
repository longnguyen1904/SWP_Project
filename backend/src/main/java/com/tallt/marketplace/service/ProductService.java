package com.tallt.marketplace.service;

import com.tallt.marketplace.dto.PageResponse;
import com.tallt.marketplace.dto.product.*;
import com.tallt.marketplace.dto.review.ReviewResponse;
import com.tallt.marketplace.entity.*;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private LicenseRepository licenseRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private VendorFollowerRepository vendorFollowerRepository;

    @Value("${vnpay.frontend-url:http://localhost:5173}")
    private String frontendBaseUrl;

    /**
     * Create a new product for Vendor
     * - Insert into Products (IsApproved=0)
     * - Insert tags into Tags (if not existing)
     * - Insert mapping into ProductTags
     */
    @Transactional
    public Map<String, Object> createProduct(Integer vendorId, CreateProductRequest request) {
        // 1. Check Vendor exists
        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new AppException("Vendor does not exist"));

        // 2. Check Vendor is verified
        if (!vendor.getIsVerified()) {
            throw new AppException("Vendor is not verified, cannot create product");
        }

        // 3. Check Category exists
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new AppException("Category does not exist"));

        // 4. Create Product
        Product product = new Product();
        product.setVendor(vendor);
        product.setCategory(category);
        product.setProductName(request.getProductName());
        product.setDescription(request.getDescription());
        product.setBasePrice(request.getBasePrice());
        product.setStatus(Product.ProductStatus.DRAFT);
        product.setHasTrial(request.getHasTrial() != null ? request.getHasTrial() : false);
        product.setTrialDurationDays(request.getTrialDurationDays() != null ? request.getTrialDurationDays() : 7);
        if (request.getGuideDocumentUrl() != null && !request.getGuideDocumentUrl().isBlank()) {
            product.setGuideDocumentUrl(request.getGuideDocumentUrl().trim());
        }
        productRepository.save(product);

        // 5. Process Tags
        if (request.getTags() != null && !request.getTags().isEmpty()) {
            for (String tagName : request.getTags()) {
                // Find or create Tag
                Tag tag = tagRepository.findByTagName(tagName.trim().toLowerCase())
                        .orElseGet(() -> {
                            Tag newTag = new Tag();
                            newTag.setTagName(tagName.trim().toLowerCase());
                            return tagRepository.save(newTag);
                        });

                // Create ProductTag mapping
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
     * Upload a single product image (backward compatible)
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
                "message", "Product image uploaded successfully"
        );
    }

    /**
     * Upload multiple product images at once
     * @param imageUrls list of image URLs (already uploaded to Cloudinary)
     * @param imageType image type (SCREENSHOT, LOGO, BANNER...)
     */
    @Transactional
    public Map<String, Object> uploadProductImages(Integer vendorId, Integer productId,
                                                    List<String> imageUrls, String imageType) {
        Product product = getProductAndValidateOwner(vendorId, productId);

        List<Integer> imageIds = new ArrayList<>();
        int currentMaxSort = productImageRepository.findByProduct_ProductIDOrderBySortOrderAsc(productId).size();

        for (int i = 0; i < imageUrls.size(); i++) {
            ProductImage image = new ProductImage();
            image.setProduct(product);
            image.setImageUrl(imageUrls.get(i));
            image.setIsPrimary(i == 0 && currentMaxSort == 0);
            image.setSortOrder(currentMaxSort + i);
            image.setImageType(imageType != null ? imageType : "SCREENSHOT");
            productImageRepository.save(image);
            imageIds.add(image.getImageID());
        }

        return Map.of(
                "imageIds", imageIds,
                "count", imageIds.size(),
                "message", "Successfully uploaded " + imageIds.size() + " images"
        );
    }

    /**
     * Delete a product image (Vendor can only delete images from their own products).
     */
    @Transactional
    public void deleteProductImage(Integer vendorId, Integer productId, Integer imageId) {
        Product product = getProductAndValidateOwner(vendorId, productId);
        ProductImage image = productImageRepository.findById(imageId)
                .orElseThrow(() -> new AppException("Image does not exist"));
        if (!image.getProduct().getProductID().equals(product.getProductID())) {
            throw new AppException("Image does not belong to this product");
        }
        productImageRepository.delete(image);
    }

    /**
     * Update product information
     * - DRAFT / REJECTED: allow edit, keep status
     * - APPROVED: allow edit, change status to PENDING for re-approval
     * - PENDING: editing not allowed
     */
    @Transactional
    public ProductResponse updateProduct(Integer vendorId, Integer productId, UpdateProductRequest request) {
        Product product = getProductAndValidateOwner(vendorId, productId);

        if (product.getStatus() == Product.ProductStatus.PENDING) {
            throw new AppException("Cannot edit a product that is pending review");
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
        if (request.getGuideDocumentUrl() != null) {
            product.setGuideDocumentUrl(request.getGuideDocumentUrl().isBlank() ? null : request.getGuideDocumentUrl().trim());
        }

        // If product was APPROVED, change to PENDING for Admin re-approval
        if (product.getStatus() == Product.ProductStatus.APPROVED) {
            product.setStatus(Product.ProductStatus.PENDING);
        }

        productRepository.save(product);

        return toProductResponse(product);
    }

    /**
     * Save Draft — save product draft with minimal validation.
     * Only used when product is in DRAFT or REJECTED status.
     */
    @Transactional
    public ProductResponse saveDraft(Integer vendorId, Integer productId, UpdateProductRequest request) {
        Product product = getProductAndValidateOwner(vendorId, productId);

        if (product.getStatus() != Product.ProductStatus.DRAFT
                && product.getStatus() != Product.ProductStatus.REJECTED) {
            throw new AppException("Can only save draft when product is in DRAFT or REJECTED status");
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
        if (request.getGuideDocumentUrl() != null) {
            product.setGuideDocumentUrl(request.getGuideDocumentUrl().isBlank() ? null : request.getGuideDocumentUrl().trim());
        }

        // If REJECTED -> change to DRAFT when saving draft
        if (product.getStatus() == Product.ProductStatus.REJECTED) {
            product.setStatus(Product.ProductStatus.DRAFT);
            product.setRejectionNote(null);
        }

        productRepository.save(product);
        return toProductResponse(product);
    }

    /**
     * Submit product for Admin approval
     * - Validate all required information
     * - Validate at least 1 version + 1 license tier
     * - Only submit when DRAFT or REJECTED
     */
    @Transactional
    public Map<String, Object> submitForApproval(Integer vendorId, Integer productId) {
        Product product = getProductAndValidateOwner(vendorId, productId);

        if (product.getStatus() == Product.ProductStatus.APPROVED) {
            throw new AppException("Product has already been approved");
        }

        if (product.getStatus() == Product.ProductStatus.PENDING) {
            throw new AppException("Product is already pending review");
        }

        // Validate required information
        if (product.getProductName() == null || product.getProductName().isBlank()) {
            throw new AppException("Product name is required for submission");
        }
        if (product.getBasePrice() == null || product.getBasePrice().doubleValue() <= 0) {
            throw new AppException("Product price must be greater than 0 for submission");
        }
        if (product.getCategory() == null) {
            throw new AppException("Product category is required for submission");
        }
        if (product.getDescription() == null || product.getDescription().isBlank()) {
            throw new AppException("Product description is required for submission");
        }
        if (Boolean.TRUE.equals(product.getHasTrial())) {
            if (product.getTrialDurationDays() == null || product.getTrialDurationDays() <= 0) {
                throw new AppException("Trial duration must be greater than 0 when trial mode is enabled");
            }
        }

        // Check at least 1 version
        long versionCount = productVersionRepository.countByProduct_ProductID(productId);
        if (versionCount == 0) {
            throw new AppException("Product must have at least 1 version before submission");
        }

        // Check at least 1 license tier
        long tierCount = licenseTierRepository.countByProduct_ProductID(productId);
        if (tierCount == 0) {
            throw new AppException("Product must have at least 1 license tier before submission");
        }

        product.setStatus(Product.ProductStatus.PENDING);
        productRepository.save(product);

        return Map.of(
                "productId", product.getProductID(),
                "status", "PENDING",
                "message", "Product has been submitted for approval"
        );
    }

    /**
     * Admin approve/reject product
     * - status: APPROVED or REJECTED
     * - note: rejection reason (if REJECTED)
     */
    @Transactional
    public Map<String, Object> reviewProduct(Integer productId, String status, String note) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException("Product does not exist"));

        if (product.getStatus() == Product.ProductStatus.APPROVED) {
            throw new AppException("Product has already been approved");
        }

        Product.ProductStatus newStatus;
        try {
            newStatus = Product.ProductStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new AppException("Invalid status. Accepted values: APPROVED or REJECTED");
        }

        if (newStatus != Product.ProductStatus.APPROVED && newStatus != Product.ProductStatus.REJECTED) {
            throw new AppException("Invalid status. Accepted values: APPROVED or REJECTED");
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
                String subject = "Product Approved";
                String title = "Congratulations! 🎉";
                String body = "<p>Your product <strong>" + product.getProductName()
                        + "</strong> has been approved by Admin.</p>"
                        + "<div style='background:#2d3748;border-left:4px solid #48bb78;padding:16px 20px;border-radius:6px;margin:16px 0;'>"
                        + "<p style='margin:0;color:#48bb78;font-weight:600;'>✅ Product is now live on the marketplace</p></div>"
                        + "<p>Customers can now discover and purchase your product.</p>";
                emailService.sendEmail(to, subject, title, body);
            } catch (Exception ignored) {
            }

            // Gửi email thông báo cho followers của vendor
            notifyFollowersOfNewProduct(product);
        }

        return Map.of(
                "productId", product.getProductID(),
                "status", product.getStatus().name(),
                "message", newStatus == Product.ProductStatus.APPROVED
                        ? "Product has been approved successfully"
                        : "Product has been rejected"
        );
    }

    /**
     * Get vendor's product list with filter, search, paging, sort
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
                throw new AppException("Invalid product status. Accepted values: DRAFT, PENDING, APPROVED, REJECTED");
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
     * Get all products (Admin) with filter, search, paging, sort
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
                throw new AppException("Invalid product status. Accepted values: DRAFT, PENDING, APPROVED, REJECTED");
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
     * Get product detail by ID
     */
    public ProductResponse getProductById(Integer productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException("Product does not exist"));
        return toProductResponse(product);
    }

    /**
     * UC11 - Marketplace Storefront: list sản phẩm public đã được duyệt
     */
    public PageResponse<ProductResponse> getStorefrontProducts(String search,
                                                               List<Integer> categoryIds,
                                                               Boolean hasTrial,
                                                               java.math.BigDecimal minPrice,
                                                               java.math.BigDecimal maxPrice,
                                                               List<String> tags,
                                                               int page, int size,
                                                               String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        List<Integer> normalizedCategoryIds = (categoryIds != null && !categoryIds.isEmpty()) ? categoryIds : null;
        List<String> normalizedTags = (tags != null && !tags.isEmpty())
                ? tags.stream().map(t -> t.trim().toLowerCase()).collect(Collectors.toList())
                : null;

        Page<Product> productPage = productRepository.findApprovedStorefront(
                (search != null && !search.isBlank()) ? search.trim() : null,
                normalizedCategoryIds,
                hasTrial,
                minPrice,
                maxPrice,
                normalizedTags,
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
            throw new AppException("Product has not been approved");
        }

        return buildProductDetail(product, relatedSize);
    }

    /**
     * Vendor xem chi tiết sản phẩm của chính mình (mọi status)
     */
    public ProductDetailResponse getVendorProductDetail(Integer vendorId, Integer productId, int relatedSize) {
        Product product = getProductAndValidateOwner(vendorId, productId);
        return buildProductDetail(product, relatedSize);
    }

    /**
     * Build product detail response (dùng chung cho public + vendor)
     */
    private ProductDetailResponse buildProductDetail(Product product, int relatedSize) {
        Integer productId = product.getProductID();

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
            throw new AppException("Product has not been approved");
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

    /**
     * UC12 - Chỉ Customer đã mua hàng (Order PaymentStatus != Pending) mới được gửi đánh giá.
     * Admin: không được đánh giá. Vendor: không được đánh giá (chỉ xem).
     */
    @Transactional
    public ReviewResponse createReview(Integer productId, Integer userId, Integer rating, String comment) {
        if (userId == null) {
            throw new AppException("You must be logged in to review a product");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User không tồn tại"));
        String roleName = user.getRole() != null ? user.getRole().getRoleName() : "";
        if ("ADMIN".equalsIgnoreCase(roleName)) {
            throw new AppException("Admin cannot review products. View only.");
        }
        if ("VENDOR".equalsIgnoreCase(roleName)) {
            throw new AppException("Vendor can only view reviews, cannot submit reviews.");
        }
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException("Sản phẩm không tồn tại"));
        if (product.getStatus() != Product.ProductStatus.APPROVED) {
            throw new AppException("Cannot review an unapproved product");
        }
        if (!orderRepository.existsByProduct_ProductIDAndUser_UserIDAndPaymentStatusIgnoreCaseNot(
                productId, userId, "Pending")) {
            throw new AppException("You must purchase the product before reviewing.");
        }
        if (reviewRepository.existsByProduct_ProductIDAndUser_UserID(productId, userId)) {
            throw new AppException("You have already reviewed this product. Only 1 review per product.");
        }
        Review review = new Review();
        review.setProduct(product);
        review.setUser(user);
        review.setRating(rating != null ? rating : 0);
        review.setComment(comment != null ? comment : "");
        review = reviewRepository.save(review);
        ReviewResponse rr = new ReviewResponse();
        rr.setReviewId(review.getReviewID());
        rr.setUserId(review.getUser().getUserID());
        rr.setFullName(review.getUser().getFullName());
        rr.setRating(review.getRating());
        rr.setComment(review.getComment());
        rr.setCreatedAt(review.getCreatedAt());
        return rr;
    }

    /**
     * Kiểm tra user đã có đơn hàng đã thanh toán (PaymentStatus != Pending) cho sản phẩm.
     */
    public boolean hasPurchasedProduct(Integer productId, Integer userId) {
        if (productId == null || userId == null) return false;
        return orderRepository.existsByProduct_ProductIDAndUser_UserIDAndPaymentStatusIgnoreCaseNot(
                productId, userId, "Pending");
    }

    /**
     * Customer chỉ được sửa review của chính mình; 1 review/user/product.
     */
    @Transactional
    public ReviewResponse updateReview(Integer reviewId, Integer userId, Integer rating, String comment) {
        if (userId == null) throw new AppException("You must be logged in.");
        if (reviewId == null) throw new AppException("Review ID không hợp lệ.");
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new AppException("Review does not exist"));
        if (review.getUser() == null || !review.getUser().getUserID().equals(userId)) {
            throw new AppException("You can only edit your own review.");
        }
        review.setRating(rating != null ? rating : review.getRating());
        review.setComment(comment != null ? comment : review.getComment());
        review = reviewRepository.save(review);
        ReviewResponse rr = new ReviewResponse();
        rr.setReviewId(review.getReviewID());
        rr.setUserId(review.getUser().getUserID());
        rr.setFullName(review.getUser().getFullName());
        rr.setRating(review.getRating());
        rr.setComment(review.getComment());
        rr.setCreatedAt(review.getCreatedAt());
        return rr;
    }

    /**
     * Customer chỉ được xóa review của chính mình.
     */
    @Transactional
    public void deleteReview(Integer reviewId, Integer userId) {
        if (userId == null) throw new AppException("You must be logged in.");
        if (reviewId == null) throw new AppException("Review ID không hợp lệ.");
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new AppException("Review does not exist"));
        if (review.getUser() == null || !review.getUser().getUserID().equals(userId)) {
            throw new AppException("You can only delete your own review.");
        }
        reviewRepository.delete(review);
    }

    // ==================== HELPER METHODS ====================

    /**
     * Check product exists & Vendor is the owner
     */
    private Product getProductAndValidateOwner(Integer vendorId, Integer productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException("Product does not exist"));

        if (!product.getVendor().getVendorID().equals(vendorId)) {
            throw new AppException("You do not have permission to perform this action on this product");
        }
        return product;
    }

    /**
     * Convert Product entity to ProductResponse DTO
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
        response.setRejectionNote(product.getRejectionNote());
        response.setGuideDocumentUrl(product.getGuideDocumentUrl());

        productImageRepository.findTopByProduct_ProductIDOrderBySortOrderAsc(product.getProductID())
                .ifPresent(img -> response.setThumbnailUrl(img.getImageUrl()));

        Double avgRating = reviewRepository.getAverageRating(product.getProductID());
        response.setAverageRating(avgRating != null ? avgRating : 0.0);
        response.setReviewCount(reviewRepository.countByProduct_ProductID(product.getProductID()));
        response.setSoldCount(orderRepository.countCompletedByProductId(product.getProductID()));

        return response;
    }

    /**
     * Delete product
     * - Vendor must be the owner
     * - Delete all related child records before deleting product
     */
    @Transactional
    public void deleteProduct(Integer vendorId, Integer productId) {
        Product product = getProductAndValidateOwner(vendorId, productId);
        
        // Xóa các bản ghi con theo đúng thứ tự FK
        // 1. License (tham chiếu Order + Product + LicenseTier)
        licenseRepository.deleteByProduct_ProductID(productId);
        // 2. Order (tham chiếu Product + LicenseTier)
        orderRepository.deleteByProduct_ProductID(productId);
        // 3. Review
        reviewRepository.deleteByProduct_ProductID(productId);
        // 4. ProductTag
        productTagRepository.deleteByProductID(productId);
        // 5. ProductImage
        productImageRepository.deleteByProduct_ProductID(productId);
        // 6. ProductVersion
        productVersionRepository.deleteByProduct_ProductID(productId);
        // 7. LicenseTier (sau khi License + Order đã xóa)
        licenseTierRepository.deleteByProduct_ProductID(productId);
        
        // Cuối cùng xóa Product
        productRepository.delete(product);
    }
    /**
     * Gửi email thông báo sản phẩm mới cho tất cả followers của vendor.
     * Non-blocking: exception không ảnh hưởng đến luồng approve.
     */
    private void notifyFollowersOfNewProduct(Product product) {
        try {
            Integer vendorId = product.getVendor().getVendorID();
            List<String> emails = vendorFollowerRepository.findFollowerEmailsByVendorId(vendorId);
            System.out.println("[FollowerNotify] Vendor " + vendorId + " has " + emails.size() + " follower(s)");
            if (emails.isEmpty()) return;

            String vendorName = product.getVendor().getCompanyName() != null
                    ? product.getVendor().getCompanyName()
                    : product.getVendor().getUser().getFullName();

            String subject = "New Product from " + vendorName + ": " + product.getProductName();
            String title = "New Product Available";
            String body = "<p>Hello,</p>"
                    + "<p>A vendor you follow — <strong>" + vendorName
                    + "</strong> — just published a new product:</p>"
                    + "<div style='background:#2d3748;border-left:4px solid #f86115;padding:16px 20px;border-radius:6px;margin:16px 0;'>"
                    + "<p style='margin:0 0 4px;color:#e2e8f0;font-size:18px;font-weight:600;'>" + product.getProductName() + "</p>"
                    + "<p style='margin:0;color:#a0aec0;'>" + product.getCategory().getCategoryName() + "</p>"
                    + "</div>"
                    + "<p style='text-align:center;margin:24px 0;'>"
                    + "<a href='" + frontendBaseUrl + "/products/" + product.getProductID() + "' "
                    + "style='display:inline-block;background:linear-gradient(135deg,#f86115 0%,#ff6a3d 100%);"
                    + "color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;"
                    + "font-size:16px;font-weight:600;'>Khám phá ngay →</a></p>";

            for (String email : emails) {
                try {
                    System.out.println("[FollowerNotify] Sending email to: " + email);
                    emailService.sendEmail(email, subject, title, body);
                } catch (Exception e) {
                    System.err.println("[FollowerNotify] Failed to send to " + email + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("[FollowerNotify] Error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
