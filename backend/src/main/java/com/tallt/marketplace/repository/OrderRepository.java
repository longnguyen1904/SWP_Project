package com.tallt.marketplace.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.tallt.marketplace.dto.user.OrderWithDownloadDTO;
import com.tallt.marketplace.entity.Order;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {

        Optional<Order> findByTransactionRef(String transactionRef);

        boolean existsByProduct_ProductIDAndUser_UserIDAndPaymentStatusIgnoreCaseNot(
                        Integer productID, Integer userID, String paymentStatus);

        /** Kiểm tra user đã có đơn hàng COMPLETED cho sản phẩm (dùng cho checkout). */
        boolean existsByProduct_ProductIDAndUser_UserIDAndPaymentStatusIgnoreCase(
                        Integer productID, Integer userID, String paymentStatus);

        List<Order> findByUser_UserID(Integer userID);

        void deleteByProduct_ProductID(Integer productId);

        /** UC13: Lấy danh sách email (không trùng) của Customer đã mua sản phẩm. */
        @Query("SELECT DISTINCT o.user.email FROM Order o " +
                        "WHERE o.product.productID = :productId " +
                        "AND UPPER(o.paymentStatus) = 'COMPLETED'")
        List<String> findBuyerEmailsByProductId(@Param("productId") Integer productId);

        @Query("""
                        SELECT new com.tallt.marketplace.dto.OrderDownloadDTO(
                            o.orderID,
                            pv.fileUrl
                        )
                        FROM Order o
                        JOIN o.product p
                        JOIN ProductVersion pv ON pv.product = p
                        WHERE o.user.userID = :userId
                        AND o.paymentStatus = 'COMPLETED'
                        AND pv.versionID = (
                            SELECT MAX(pv2.versionID)
                            FROM ProductVersion pv2
                            WHERE pv2.product = p
                        )
                        """)
        List<OrderWithDownloadDTO> findOrderDownloadLinks(@Param("userId") Integer userId);
}
