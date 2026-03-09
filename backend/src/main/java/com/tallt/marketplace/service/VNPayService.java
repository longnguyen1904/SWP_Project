package com.tallt.marketplace.service;

import com.tallt.marketplace.config.VNPayConfig;
import com.tallt.marketplace.entity.Order;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.TreeMap;

/**
 * Service xử lý VNPay: tạo URL thanh toán và xác minh callback.
 *
 * Trách nhiệm duy nhất (SRP): chỉ lo giao tiếp với VNPay API.
 */
@Service
public class VNPayService {

    private final VNPayConfig vnPayConfig;

    public VNPayService(VNPayConfig vnPayConfig) {
        this.vnPayConfig = vnPayConfig;
    }

    /**
     * Tạo URL thanh toán VNPay từ thông tin Order.
     *
     * @param order     đơn hàng đã lưu (có orderID, totalAmount)
     * @param ipAddress IP của khách hàng (để VNPay ghi nhận)
     * @return URL đầy đủ để redirect browser sang VNPay gateway
     */
    public String createPaymentUrl(Order order, String ipAddress) {
        // Quy đổi sang đơn vị VNPay (VND * 100, không có số thập phân)
        long amountInVNPay = order.getTotalAmount().longValue() * 100;

        // Thời gian tạo + hết hạn (15 phút)
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        String createDate = LocalDateTime.now().format(fmt);
        String expireDate = LocalDateTime.now().plusMinutes(15).format(fmt);

        // Build params theo thứ tự alphabet (yêu cầu của VNPay)
        TreeMap<String, String> params = new TreeMap<>();
        params.put("vnp_Version", vnPayConfig.getVersion());
        params.put("vnp_Command", vnPayConfig.getCommand());
        params.put("vnp_TmnCode", vnPayConfig.getTmnCode());
        params.put("vnp_Amount", String.valueOf(amountInVNPay));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", String.valueOf(order.getOrderID()));
        params.put("vnp_OrderInfo", "Thanh toan don hang #" + order.getOrderID());
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", vnPayConfig.getReturnUrl());
        params.put("vnp_IpAddr", ipAddress != null ? ipAddress : "127.0.0.1");
        params.put("vnp_CreateDate", createDate);
        params.put("vnp_ExpireDate", expireDate);

        // Build query string + tính HMAC
        String queryString = buildQueryString(params);
        String secureHash = hmacSHA512(vnPayConfig.getHashSecret(), queryString);

        return vnPayConfig.getPayUrl() + "?" + queryString + "&vnp_SecureHash=" + secureHash;
    }

    /**
     * Xác minh chữ ký số callback từ VNPay.
     *
     * @param params tất cả query params VNPay gửi về
     * @return true nếu chữ ký hợp lệ
     */
    public boolean validateCallback(Map<String, String> params) {
        String receivedHash = params.get("vnp_SecureHash");
        if (receivedHash == null) return false;

        // Loại bỏ vnp_SecureHash và vnp_SecureHashType trước khi tính lại
        TreeMap<String, String> sortedParams = new TreeMap<>(params);
        sortedParams.remove("vnp_SecureHash");
        sortedParams.remove("vnp_SecureHashType");

        String queryString = buildQueryString(sortedParams);
        String calculatedHash = hmacSHA512(vnPayConfig.getHashSecret(), queryString);

        return calculatedHash.equalsIgnoreCase(receivedHash);
    }

    // ==================== PRIVATE METHODS ====================

    /**
     * Build query string từ TreeMap (đã sắp xếp alphabet).
     */
    private String buildQueryString(TreeMap<String, String> params) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (entry.getValue() != null && !entry.getValue().isEmpty()) {
                if (sb.length() > 0) sb.append("&");
                sb.append(URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8));
                sb.append("=");
                sb.append(URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8));
            }
        }
        return sb.toString();
    }

    /**
     * Tính HMAC-SHA512 theo yêu cầu VNPay.
     */
    private String hmacSHA512(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            mac.init(secretKey);
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));

            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to compute HMAC-SHA512", e);
        }
    }
}
