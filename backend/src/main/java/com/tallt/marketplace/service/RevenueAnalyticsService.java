package com.tallt.marketplace.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RevenueAnalyticsService {

    private final JdbcTemplate jdbcTemplate;

    /**
     * 📈 Doanh thu theo ngày
     */
    public List<Map<String, Object>> getDailyRevenue(
            int vendorId,
            LocalDate startDate,
            LocalDate endDate
    ) {

        String sql = """
            SELECT 
                DATE(o.CreatedAt) AS date,
                SUM(oi.Price) AS revenue
            FROM Orders o
            JOIN OrderItems oi ON o.OrderID = oi.OrderID
            JOIN Products p ON o.ProductID = p.ProductID
            WHERE p.VendorID = ?
              AND o.PaymentStatus = 'Completed'
              AND o.CreatedAt BETWEEN ? AND ?
            GROUP BY DATE(o.CreatedAt)
            ORDER BY DATE(o.CreatedAt)
        """;

        return jdbcTemplate.queryForList(
                sql,
                vendorId,
                startDate,
                endDate
        );
    }

    /**
     * 🔢 Tổng doanh thu
     */
    public BigDecimal getTotalRevenueByVendor(
            int vendorId,
            LocalDate startDate,
            LocalDate endDate
    ) {

        String sql = """
            SELECT COALESCE(SUM(oi.Price), 0)
            FROM Orders o
            JOIN OrderItems oi ON o.OrderID = oi.OrderID
            JOIN Products p ON o.ProductID = p.ProductID
            WHERE p.VendorID = ?
              AND o.PaymentStatus = 'Completed'
              AND o.CreatedAt BETWEEN ? AND ?
        """;

        return jdbcTemplate.queryForObject(
                sql,
                BigDecimal.class,
                vendorId,
                startDate,
                endDate
        );
    }

    /**
     * 🏆 Top sản phẩm bán chạy
     */
    public List<Map<String, Object>> getTopProducts(
            int vendorId,
            LocalDate startDate,
            LocalDate endDate
    ) {

        String sql = """
            SELECT 
                p.ProductName AS productName,
                SUM(oi.Price) AS revenue
            FROM Orders o
            JOIN OrderItems oi ON o.OrderID = oi.OrderID
            JOIN Products p ON o.ProductID = p.ProductID
            WHERE p.VendorID = ?
              AND o.PaymentStatus = 'Completed'
              AND o.CreatedAt BETWEEN ? AND ?
            GROUP BY p.ProductID, p.ProductName
            ORDER BY revenue DESC
            LIMIT 5
        """;

        return jdbcTemplate.queryForList(
                sql,
                vendorId,
                startDate,
                endDate
        );
    }
}
