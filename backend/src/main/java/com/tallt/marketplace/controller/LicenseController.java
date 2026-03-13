package com.tallt.marketplace.controller;

import com.tallt.marketplace.entity.License;
import com.tallt.marketplace.service.LicenseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "*") // Cho phép React gọi API
public class LicenseController {

    private final LicenseService licenseService;

    public LicenseController(LicenseService licenseService) {
        this.licenseService = licenseService;
    }

    /**
     * Endpoint xử lý khi thanh toán thành công từ Frontend (PaymentResult.js)
     * POST http://localhost:8081/api/payment/success/{orderId}
     */
    @PostMapping("/success/{orderId}")
    public ResponseEntity<?> handlePaymentSuccess(@PathVariable Integer orderId) {
        try {
            License newLicense = licenseService.createLicenseForOrder(orderId);
            return ResponseEntity.ok(newLicense);
        } catch (RuntimeException e) {
            // Nếu license đã tồn tại hoặc order không tìm thấy
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("An error occurred while creating license");
        }
    }
}