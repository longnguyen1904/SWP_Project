package com.tallt.marketplace.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;


@Repository
public class RevenueRepository {

    @PersistenceContext
    private EntityManager entityManager;

    // 📈 Doanh thu theo ngày
    public List<Object[]> getDailyRevenue(
            int vendorId,
            LocalDateTime from,
            LocalDateTime to) {

        String sql = """
            SELECT DATE(o.CreatedAt), SUM(o.TotalAmount)
            FROM Orders o
            JOIN Products p ON o.ProductID = p.ProductID
            WHERE p.VendorID = :vendorId
              AND o.PaymentStatus = 'Completed'
              AND o.CreatedAt BETWEEN :from AND :to
            GROUP BY DATE(o.CreatedAt)
            ORDER BY DATE(o.CreatedAt)
        """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("vendorId", vendorId);
        query.setParameter("from", from);
        query.setParameter("to", to);

        return query.getResultList();
    }

    // 📊 Tổng doanh thu + số đơn
    public Object[] getSummary(
            int vendorId,
            LocalDateTime from,
            LocalDateTime to) {

        String sql = """
            SELECT SUM(o.TotalAmount), COUNT(o.OrderID)
            FROM Orders o
            JOIN Products p ON o.ProductID = p.ProductID
            WHERE p.VendorID = :vendorId
              AND o.PaymentStatus = 'Completed'
              AND o.CreatedAt BETWEEN :from AND :to
        """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("vendorId", vendorId);
        query.setParameter("from", from);
        query.setParameter("to", to);

        return (Object[]) query.getSingleResult();
    }
}

