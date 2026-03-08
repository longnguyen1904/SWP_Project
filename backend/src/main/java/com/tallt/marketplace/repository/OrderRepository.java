package com.tallt.marketplace.repository;

import com.tallt.marketplace.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {

    Optional<Order> findByTransactionRef(String transactionRef);

    /** Kiểm tra user đã có đơn hàng đã thanh toán (PaymentStatus != Pending) cho sản phẩm. */
    boolean existsByProduct_ProductIDAndUser_UserIDAndPaymentStatusIgnoreCaseNot(
            Integer productID, Integer userID, String paymentStatus);

    /** Kiểm tra user đã có đơn hàng COMPLETED cho sản phẩm (dùng cho checkout). */
    boolean existsByProduct_ProductIDAndUser_UserIDAndPaymentStatusIgnoreCase(
            Integer productID, Integer userID, String paymentStatus);
}
