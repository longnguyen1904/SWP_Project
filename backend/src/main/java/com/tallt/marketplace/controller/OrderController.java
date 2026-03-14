package com.tallt.marketplace.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tallt.marketplace.dto.user.OrderWithDownloadDTO;
import com.tallt.marketplace.entity.Order;
import com.tallt.marketplace.service.OrderService;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    @Autowired
    private OrderService orderService;

    // Lấy tất cả orders (admin)
    @GetMapping
    public List<Order> getAllOrders() {
        return orderService.getAllOrders();
    }

    // Lấy orders theo userID
    @GetMapping("/user/{userId}")
    public List<Order> getOrdersByUser(@PathVariable Integer userId) {
        return orderService.getOrdersByUser(userId);
    }

    @GetMapping("/user/{userId}/download-links")
    public List<OrderWithDownloadDTO> getDownloadLinks(@PathVariable Integer userId) {
        return orderService.getOrderDownloadLinks(userId); 
    }
}
