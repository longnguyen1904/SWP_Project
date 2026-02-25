package com.tallt.marketplace.service;

import com.tallt.marketplace.dto.trial.TrialStartResponse;
import com.tallt.marketplace.entity.License;
import com.tallt.marketplace.entity.LicenseTier;
import com.tallt.marketplace.entity.Order;
import com.tallt.marketplace.entity.Product;
import com.tallt.marketplace.entity.User;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.repository.LicenseRepository;
import com.tallt.marketplace.repository.LicenseTierRepository;
import com.tallt.marketplace.repository.OrderRepository;
import com.tallt.marketplace.repository.ProductRepository;
import com.tallt.marketplace.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class TrialService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private LicenseTierRepository licenseTierRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private LicenseRepository licenseRepository;

    @Transactional
    public TrialStartResponse startTrial(Integer userId, Integer productId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User không tồn tại"));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException("Sản phẩm không tồn tại"));

        if (product.getStatus() != Product.ProductStatus.APPROVED) {
            throw new AppException("Sản phẩm chưa được duyệt");
        }

        if (!Boolean.TRUE.equals(product.getHasTrial())) {
            throw new AppException("Sản phẩm không hỗ trợ dùng thử");
        }

        boolean tried = licenseRepository.existsByUser_UserIDAndProduct_ProductIDAndIsTrialTrueAndIsDeletedFalse(
                userId, productId
        );
        if (tried) {
            throw new AppException("Bạn đã dùng thử sản phẩm này trước đó");
        }

        LicenseTier tier = licenseTierRepository.findTopByProduct_ProductIDOrderByTierIDAsc(productId)
                .orElseThrow(() -> new AppException("Sản phẩm chưa cấu hình license tier"));

        int trialDays = product.getTrialDurationDays() != null ? product.getTrialDurationDays() : 7;
        if (trialDays <= 0) {
            trialDays = 7;
        }

        Order order = new Order();
        order.setUser(user);
        order.setProduct(product);
        order.setTier(tier);
        order.setQuantity(1);
        order.setUnitPrice(BigDecimal.ZERO);
        order.setDiscountAmount(BigDecimal.ZERO);
        order.setTotalAmount(BigDecimal.ZERO);
        order.setPaymentMethod("TRIAL");
        order.setPaymentStatus("Paid");
        order.setTransactionRef("TRIAL-" + UUID.randomUUID());
        orderRepository.save(order);

        License license = new License();
        license.setOrder(order);
        license.setUser(user);
        license.setProduct(product);
        license.setTier(tier);
        license.setIsActive(true);
        license.setIsTrial(true);
        license.setExpireAt(LocalDateTime.now().plusDays(trialDays));

        license.setLicenseKey(generateLicenseKey());
        while (licenseRepository.existsByLicenseKey(license.getLicenseKey())) {
            license.setLicenseKey(generateLicenseKey());
        }

        licenseRepository.save(license);

        TrialStartResponse response = new TrialStartResponse();
        response.setOrderId(order.getOrderID());
        response.setLicenseId(license.getLicenseID());
        response.setLicenseKey(license.getLicenseKey());
        response.setExpireAt(license.getExpireAt());
        return response;
    }

    private String generateLicenseKey() {
        return "TRIAL-" + UUID.randomUUID();
    }
}
