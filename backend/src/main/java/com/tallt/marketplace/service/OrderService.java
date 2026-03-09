package com.tallt.marketplace.service;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.tallt.marketplace.entity.Order;
import com.tallt.marketplace.repository.OrderRepository;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    public List<Order> getOrdersByUser(Integer userId){
        return orderRepository.findByUser_UserID(userId);
    }

    public List<Order> getAllOrders(){
        return orderRepository.findAll();
    }
}