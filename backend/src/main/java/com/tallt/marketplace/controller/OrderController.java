package com.tallt.marketplace.controller;

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
@CrossOrigin(origins = "http://localhost:5173") 
public class OrderController {
    
    @Autowired
    private OrderService orderService;

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
    // API 1: Lấy đơn hàng của cá nhân (Gọi trực tiếp Service)
    // =================================================================
    @GetMapping("/user/{userId}/ticket-products")
    public ResponseEntity<List<Map<String, Object>>> getProductsForTicket(@PathVariable Integer userId) {
        List<Map<String, Object>> response = orderService.getTicketProductsForUser(userId);
        return ResponseEntity.ok(response);
    }

    // =================================================================
    // API 2: Lấy TẤT CẢ sản phẩm trên nền tảng (Gọi trực tiếp Service)
    // =================================================================
    @GetMapping("/all-ticket-products")
    public ResponseEntity<List<Map<String, Object>>> getAllPlatformProducts() {
        List<Map<String, Object>> response = orderService.getAllPlatformTicketProducts();
        return ResponseEntity.ok(response);
    }
}