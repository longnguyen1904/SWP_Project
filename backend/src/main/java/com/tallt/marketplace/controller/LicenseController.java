package com.tallt.marketplace.controller;

import com.tallt.marketplace.dto.product.LicenseVerifyRequest;
import com.tallt.marketplace.entity.License;
import com.tallt.marketplace.repository.LicenseRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(originPatterns = "*") // Cho phép React gọi API
public class LicenseController {

    private final LicenseRepository licenseRepository;

    public LicenseController(LicenseRepository licenseRepository) {
        this.licenseRepository = licenseRepository;
    }

    /**
     * Endpoint xử lý khi thanh toán thành công từ Frontend (PaymentResult.js)
     * POST http://localhost:8081/api/payment/success/{orderId}
     */
    @PostMapping("/success/{orderId}")
    public ResponseEntity<?> handlePaymentSuccess(@PathVariable Integer orderId) {
        try {
            // (CheckoutService)
            License license = licenseRepository.findByOrder_OrderID(orderId)
                    .orElseThrow(() -> new RuntimeException("License for this order not found yet"));
            return ResponseEntity.ok(license);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("An error occurred while fetching license");
        }
    }

}