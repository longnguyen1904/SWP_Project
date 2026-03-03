package com.tallt.marketplace.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tallt.marketplace.entity.Order;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {
}