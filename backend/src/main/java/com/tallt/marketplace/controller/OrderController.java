package com.tallt.marketplace.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tallt.marketplace.dto.user.OrderWithDownloadDTO;
import com.tallt.marketplace.entity.Order;
import com.tallt.marketplace.service.OrderService;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "http://localhost:5173") // 🔥 QUAN TRỌNG: Mở khóa để React gọi được
public class OrderController {
    
    @Autowired
    private OrderService orderService;

    // --- CÁC HÀM CŨ GIỮ NGUYÊN ---
    @GetMapping
    public List<Order> getAllOrders() {
        return orderService.getAllOrders();
    }

    @GetMapping("/user/{userId}")
    public List<Order> getOrdersByUser(@PathVariable Integer userId) {
        return orderService.getOrdersByUser(userId);
    }

    @GetMapping("/user/{userId}/download-links")
    public List<OrderWithDownloadDTO> getDownloadLinks(@PathVariable Integer userId) {
        return orderService.getOrderDownloadLinks(userId); 
    }

    // =================================================================
    // 🔥 HÀM MỚI: Dành riêng cho trang tạo Ticket
    // Chấp nhận trạng thái PAID (giống hệt DB của bạn) và chống lỗi đệ quy
    // =================================================================
    @GetMapping("/user/{userId}/ticket-products")
    public ResponseEntity<?> getProductsForTicket(@PathVariable Integer userId) {
        List<Order> orders = orderService.getOrdersByUser(userId);
        List<Map<String, Object>> safeResponse = new ArrayList<>();

        for (Order o : orders) {
            String status = o.getPaymentStatus() != null ? o.getPaymentStatus().toUpperCase() : "";
            
            // ✅ Chấp nhận PAID theo đúng Database của bạn
            if (status.equals("PAID") || status.equals("COMPLETED") || status.equals("SUCCESS")) {
                Map<String, Object> map = new HashMap<>();
                map.put("orderId", o.getOrderID());
                map.put("paymentStatus", o.getPaymentStatus());
                map.put("purchaseDate", o.getCreatedAt());
                
                if (o.getProduct() != null) {
                    map.put("productId", o.getProduct().getProductID());
                    map.put("productName", o.getProduct().getProductName());
                    map.put("productImage", o.getProduct().getGuideDocumentUrl());
                    
                    if (o.getProduct().getVendor() != null) {
                        map.put("vendorId", o.getProduct().getVendor().getVendorID());
                        map.put("vendorName", o.getProduct().getVendor().getCompanyName() != null 
                                ? o.getProduct().getVendor().getCompanyName() 
                                : "Shop #" + o.getProduct().getVendor().getVendorID());
                    }
                    if (o.getProduct().getCategory() != null) {
                        map.put("categoryName", o.getProduct().getCategory().getCategoryName());
                    }
                }
                safeResponse.add(map);
            }
        }
        return ResponseEntity.ok(safeResponse);
    }
}