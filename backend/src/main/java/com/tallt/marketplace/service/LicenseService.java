package com.tallt.marketplace.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;

import com.tallt.marketplace.controller.LicenseKeyGenerator;
import com.tallt.marketplace.entity.License;
import com.tallt.marketplace.entity.Order;
import com.tallt.marketplace.repository.LicenseRepository;
import com.tallt.marketplace.repository.OrderRepository;

import jakarta.transaction.Transactional;
    
@Service
public class LicenseService {
     private final LicenseRepository licenseRepository;
    private final OrderRepository orderRepository;

    public LicenseService(LicenseRepository licenseRepository,
                          OrderRepository orderRepository) {
        this.licenseRepository = licenseRepository;
        this.orderRepository = orderRepository;
    }
    @Transactional
    public License createLicenseForOrder(Integer orderId) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        License license = new License();                

        String key;
        do {
            key = LicenseKeyGenerator.generateKey();
        } while (licenseRepository.existsByLicenseKey(key));

        license.setLicenseKey(key);
        license.setOrder(order);
        license.setUser(order.getUser());
        license.setProduct(order.getProduct());

        license.setCreatedAt(LocalDateTime.now());
        license.setIsActive(true);
        license.setIsDeleted(false);
        license.setIsTrial(false);

        
        return licenseRepository.save(license);
    }


    public String verifyLicense(String licenseKey, Integer productID) {

    License license = licenseRepository
            .findByLicenseKey(licenseKey)
            .orElse(null);

    if (license == null) {
        return "INVALID_LICENSE";
    }

    if (!license.getProduct().getProductID().equals(productID)) {
        return "WRONG_PRODUCT";
    }

    if (!license.getIsActive()) {
        return "DISABLED";
    }

    return "VALID";
}

}
