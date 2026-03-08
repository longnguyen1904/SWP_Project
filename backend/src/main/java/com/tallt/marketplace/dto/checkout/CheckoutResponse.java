package com.tallt.marketplace.dto.checkout;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Response trả về cho Frontend sau khi tạo đơn hàng.
 * - paymentUrl: URL redirect sang VNPay gateway.
 * - warning: cảnh báo nếu user đang có License còn hiệu lực (nullable).
 */
@Data
@AllArgsConstructor
public class CheckoutResponse {
    private Integer orderId;
    private String paymentUrl;
    private String warning;

    /** Constructor không có warning (backward-compatible). */
    public CheckoutResponse(Integer orderId, String paymentUrl) {
        this(orderId, paymentUrl, null);
    }
}
