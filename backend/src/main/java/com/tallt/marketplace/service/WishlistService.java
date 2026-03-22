package com.tallt.marketplace.service;

import com.tallt.marketplace.dto.WishlistItemResponse;
import com.tallt.marketplace.entity.*;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class WishlistService {

    @Autowired
    private WishlistRepository wishlistRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductTagRepository productTagRepository;

    @Autowired
    private ProductImageRepository productImageRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private OrderRepository orderRepository;

    public List<WishlistItemResponse> getWishlistByUser(Integer userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new AppException("Người dùng không tồn tại"));

        List<Wishlist> wishlists = wishlistRepository.findByUser_UserID(userId);

        return wishlists.stream().map(w -> {
            Product p = w.getProduct();

            List<String> tagNames = productTagRepository.findByProductID(p.getProductID())
                    .stream()
                    .map(pt -> pt.getTag().getTagName())
                    .collect(Collectors.toList());

            String imageUrl = productImageRepository
                    .findTopByProduct_ProductIDOrderBySortOrderAsc(p.getProductID())
                    .map(ProductImage::getImageUrl)
                    .orElse(null);

            String categoryName = p.getCategory() != null
                    ? p.getCategory().getCategoryName()
                    : null;

            Double avgRating = reviewRepository.getAverageRating(p.getProductID());
            long reviewCount = reviewRepository.countByProduct_ProductID(p.getProductID());
            long soldCount = orderRepository.countCompletedByProductId(p.getProductID());

            WishlistItemResponse.WishlistProduct wp = new WishlistItemResponse.WishlistProduct();
            wp.setProductId(p.getProductID());
            wp.setProductName(p.getProductName());
            wp.setBasePrice(p.getBasePrice());
            wp.setCategoryName(categoryName);
            wp.setImageUrl(imageUrl);
            wp.setTags(tagNames);
            wp.setAverageRating(avgRating != null ? avgRating : 0.0);
            wp.setReviewCount(reviewCount);
            wp.setSoldCount(soldCount);

            return new WishlistItemResponse(w.getWishlistId(), wp);
        }).collect(Collectors.toList());
    }

    @Transactional
    public String toggleWishlist(Integer userId, Integer productId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("Người dùng không tồn tại"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException("Sản phẩm không tồn tại"));

        var existing = wishlistRepository.findByUser_UserIDAndProduct_ProductID(userId, productId);

        if (existing.isPresent()) {
            wishlistRepository.delete(existing.get());
            return "Đã xóa khỏi danh sách yêu thích";
        } else {
            Wishlist wishlist = new Wishlist();
            wishlist.setUser(user);
            wishlist.setProduct(product);
            wishlistRepository.save(wishlist);
            return "Đã thêm vào danh sách yêu thích";
        }
    }

    public boolean isWished(Integer userId, Integer productId) {
        return wishlistRepository.existsByUser_UserIDAndProduct_ProductID(userId, productId);
    }
}
