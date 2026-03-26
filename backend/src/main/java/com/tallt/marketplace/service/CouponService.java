package com.tallt.marketplace.service;

import com.tallt.marketplace.entity.Coupon;
import com.tallt.marketplace.entity.LicenseTier;
import com.tallt.marketplace.entity.Product;
import com.tallt.marketplace.entity.Vendor;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.repository.CouponRepository;
import com.tallt.marketplace.repository.LicenseTierRepository;
import com.tallt.marketplace.repository.ProductRepository;
import com.tallt.marketplace.repository.VendorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class CouponService {

    private final CouponRepository couponRepository;
    private final VendorRepository vendorRepository;
    private final ProductRepository productRepository;
    private final LicenseTierRepository licenseTierRepository;

    public CouponService(CouponRepository couponRepository,
                         VendorRepository vendorRepository,
                         ProductRepository productRepository,
                         LicenseTierRepository licenseTierRepository) {
        this.couponRepository = couponRepository;
        this.vendorRepository = vendorRepository;
        this.productRepository = productRepository;
        this.licenseTierRepository = licenseTierRepository;
    }

    @Transactional
    public Coupon createCoupon(Integer userId, Map<String, Object> body) {
        Vendor vendor = vendorRepository.findByUser_UserID(userId)
                .orElseThrow(() -> new AppException("Bạn không phải Vendor"));

        String code = ((String) body.get("code")).trim().toUpperCase();
        Integer discountPercent = (Integer) body.get("discountPercent");
        Integer maxUses = body.get("maxUses") != null ? (Integer) body.get("maxUses") : null;
        String expiresAtStr = (String) body.get("expiresAt");
        Integer productId = body.get("productId") != null ? (Integer) body.get("productId") : null;
        Integer tierId = body.get("tierId") != null ? (Integer) body.get("tierId") : null;

        if (code.isEmpty() || discountPercent == null) {
            throw new AppException("Mã coupon và phần trăm giảm giá không được để trống");
        }
        if (discountPercent < 1 || discountPercent > 100) {
            throw new AppException("Phần trăm giảm giá phải từ 1 đến 100");
        }
        if (couponRepository.findByCodeIgnoreCase(code).isPresent()) {
            throw new AppException("Mã coupon đã tồn tại");
        }

        Coupon coupon = new Coupon();
        coupon.setCode(code);
        coupon.setDiscountPercent(discountPercent);
        coupon.setMaxUses(maxUses);
        coupon.setVendor(vendor);
        coupon.setIsActive(true);

        if (expiresAtStr != null && !expiresAtStr.isEmpty()) {
            LocalDateTime expiresAt = LocalDateTime.parse(expiresAtStr);
            if (expiresAt.isBefore(LocalDateTime.now())) {
                throw new AppException("Expiry date must be in the future");
            }
            coupon.setExpiresAt(expiresAt);
        }

        if (productId != null) {
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new AppException("Sản phẩm không tồn tại"));
            if (!product.getVendor().getVendorID().equals(vendor.getVendorID())) {
                throw new AppException("Sản phẩm không thuộc về bạn");
            }
            coupon.setProduct(product);

            if (tierId != null) {
                LicenseTier tier = licenseTierRepository.findById(tierId)
                        .orElseThrow(() -> new AppException("Gói license không tồn tại"));
                if (!tier.getProduct().getProductID().equals(productId)) {
                    throw new AppException("Gói license không thuộc sản phẩm này");
                }
                coupon.setTier(tier);
            }
        }

        return couponRepository.save(coupon);
    }

    public List<Coupon> getCouponsByVendor(Integer userId) {
        Vendor vendor = vendorRepository.findByUser_UserID(userId)
                .orElseThrow(() -> new AppException("Bạn không phải Vendor"));
        return couponRepository.findByVendor_VendorID(vendor.getVendorID());
    }

    @Transactional
    public void deleteCoupon(Integer userId, Integer couponId) {
        Vendor vendor = vendorRepository.findByUser_UserID(userId)
                .orElseThrow(() -> new AppException("Bạn không phải Vendor"));
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new AppException("Coupon không tồn tại"));
        if (!coupon.getVendor().getVendorID().equals(vendor.getVendorID())) {
            throw new AppException("Bạn không có quyền xóa coupon này");
        }
        couponRepository.delete(coupon);
    }

    public Map<String, Object> validateCoupon(String code, Integer productId, Integer tierId) {
        Coupon coupon = couponRepository.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new AppException("Mã coupon không tồn tại"));

        if (!coupon.getIsActive()) {
            throw new AppException("Mã coupon đã bị vô hiệu hóa");
        }
        if (coupon.getExpiresAt() != null && coupon.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new AppException("Mã coupon đã hết hạn");
        }
        if (coupon.getMaxUses() != null && coupon.getCurrentUses() >= coupon.getMaxUses()) {
            throw new AppException("Mã coupon đã hết lượt sử dụng");
        }

        if (coupon.getProduct() != null && !coupon.getProduct().getProductID().equals(productId)) {
            throw new AppException("Mã coupon không áp dụng cho sản phẩm này");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException("Sản phẩm không tồn tại"));

        if (coupon.getProduct() == null &&
                !coupon.getVendor().getVendorID().equals(product.getVendor().getVendorID())) {
            throw new AppException("Mã coupon không áp dụng cho sản phẩm này");
        }

        if (coupon.getTier() != null && tierId != null
                && !coupon.getTier().getTierID().equals(tierId)) {
            throw new AppException("Mã coupon chỉ áp dụng cho gói " + coupon.getTier().getTierName());
        }

        return Map.of(
                "couponId", coupon.getCouponId(),
                "code", coupon.getCode(),
                "discountPercent", coupon.getDiscountPercent()
        );
    }

    @Transactional
    public Coupon useCoupon(String code) {
        Coupon coupon = couponRepository.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new AppException("Mã coupon không tồn tại"));
        coupon.setCurrentUses(coupon.getCurrentUses() + 1);
        return couponRepository.save(coupon);
    }

    public List<Map<String, Object>> getActiveCouponsForProduct(Integer productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException("Sản phẩm không tồn tại"));

        Integer vendorId = product.getVendor().getVendorID();
        List<Coupon> allVendorCoupons = couponRepository.findByVendor_VendorID(vendorId);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Coupon c : allVendorCoupons) {
            if (!c.getIsActive()) continue;
            if (c.getExpiresAt() != null && c.getExpiresAt().isBefore(LocalDateTime.now())) continue;
            if (c.getMaxUses() != null && c.getCurrentUses() >= c.getMaxUses()) continue;
            if (c.getProduct() != null && !c.getProduct().getProductID().equals(productId)) continue;

            result.add(Map.of(
                    "code", c.getCode(),
                    "discountPercent", c.getDiscountPercent()
            ));
        }
        return result;
    }
}
