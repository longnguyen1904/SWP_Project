package com.tallt.marketplace.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tallt.marketplace.entity.Order;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {

    Optional<Order> findByTransactionRef(String transactionRef);

    boolean existsByProduct_ProductIDAndUser_UserIDAndPaymentStatusIgnoreCaseNot(
            Integer productID, Integer userID, String paymentStatus);

    List<Order> findByUser_UserID(Integer userID);
}