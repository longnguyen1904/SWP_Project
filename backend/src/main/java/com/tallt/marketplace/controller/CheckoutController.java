package com.tallt.marketplace.controller;

import com.tallt.marketplace.config.VNPayConfig;
import com.tallt.marketplace.dto.ApiResponse;
import com.tallt.marketplace.dto.checkout.CheckoutRequest;
import com.tallt.marketplace.dto.checkout.CheckoutResponse;
import com.tallt.marketplace.service.CheckoutService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller xử lý checkout và callback VNPay.
 *
 * Endpoints:
 * - POST /api/checkout/create → tạo Order + trả VNPay URL
 * - GET /api/checkout/vnpay-return → VNPay redirect callback
 */
@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

    private final CheckoutService checkoutService;
    private final VNPayConfig vnPayConfig;

    public CheckoutController(CheckoutService checkoutService, VNPayConfig vnPayConfig) {
        this.checkoutService = checkoutService;
        this.vnPayConfig = vnPayConfig;
    }

    /**
     * Tạo đơn hàng và trả URL thanh toán VNPay.
     * Frontend sẽ redirect browser sang URL này.
     */
    @PostMapping("/create")
    public ResponseEntity<ApiResponse<CheckoutResponse>> createCheckout(
            @RequestHeader("X-User-Id") Integer userId,
            @Valid @RequestBody CheckoutRequest request,
            HttpServletRequest httpRequest) {

        String ipAddress = getClientIp(httpRequest);
        CheckoutResponse response = checkoutService.createCheckout(userId, request, ipAddress);

        return ResponseEntity.ok(ApiResponse.success("Tạo đơn hàng thành công", response));
    }

    /**
     * VNPay redirect callback — xử lý kết quả thanh toán.
     * Thành công → /payment-result, Thất bại → quay lại trang sản phẩm.
     */
    @GetMapping("/vnpay-return")
    public ResponseEntity<Void> vnpayReturn(@RequestParam Map<String, String> params) {
        boolean success = checkoutService.processVNPayReturn(params);
        String txnRef = params.get("vnp_TxnRef");
        String baseUrl = vnPayConfig.getFrontendUrl();

        String frontendUrl;
        if (success) {
            frontendUrl = baseUrl + "/payment-result?status=success&orderId=" + txnRef;
        } else {
            Integer productId = checkoutService.getProductIdByOrderId(txnRef);
            frontendUrl = productId != null
                    ? baseUrl + "/products/" + productId + "?paymentFailed=true"
                    : baseUrl + "/marketplace?paymentFailed=true";
        }

        return ResponseEntity.status(302)
                .header("Location", frontendUrl)
                .build();
    }

    // ==================== PRIVATE METHODS ====================

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty()) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip != null ? ip : "127.0.0.1";
    }
}
