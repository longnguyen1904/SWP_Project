package com.tallt.marketplace.controller;

import com.tallt.marketplace.dto.ApiResponse;
import com.tallt.marketplace.dto.checkout.CheckoutRequest;
import com.tallt.marketplace.dto.checkout.CheckoutResponse;
import com.tallt.marketplace.dto.checkout.PaymentConfirmRequest;
import com.tallt.marketplace.dto.checkout.PaymentConfirmResponse;
import com.tallt.marketplace.service.CheckoutService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * UC14 - Checkout/Payment Gateway (VNPay demo)
 */
@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

    @Autowired
    private CheckoutService checkoutService;

    /**
     * Tạo order và trả về paymentUrl demo
     * POST /api/checkout
     */
    @PostMapping
    public ResponseEntity<ApiResponse<CheckoutResponse>> createCheckout(
            @RequestHeader("X-User-Id") Integer userId,
            @Valid @RequestBody CheckoutRequest request) {
        CheckoutResponse response = checkoutService.createCheckout(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Tạo checkout thành công", response));
    }

    /**
     * Confirm thanh toán demo
     * POST /api/checkout/confirm
     * status: Paid / Failed
     */
    @PostMapping("/confirm")
    public ResponseEntity<ApiResponse<PaymentConfirmResponse>> confirmPayment(
            @RequestHeader("X-User-Id") Integer userId,
            @Valid @RequestBody PaymentConfirmRequest request) {
        PaymentConfirmResponse response = checkoutService.confirmPayment(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Xác nhận thanh toán thành công", response));
    }
}
