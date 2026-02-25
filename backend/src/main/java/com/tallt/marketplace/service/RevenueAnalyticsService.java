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
                DATE(wt.CreatedAt) AS date,
                SUM(wt.Amount) AS revenue
            FROM WalletTransactions wt
            JOIN Wallets w ON wt.WalletID = w.WalletID
            JOIN Vendors v ON w.UserID = v.UserID
            WHERE v.VendorID = ?
              AND wt.Type = 'SALE_REVENUE'
              AND wt.CreatedAt >= ?
              AND wt.CreatedAt < DATE_ADD(?, INTERVAL 1 DAY)
            GROUP BY DATE(wt.CreatedAt)
            ORDER BY DATE(wt.CreatedAt)
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
            SELECT COALESCE(SUM(wt.Amount), 0)
            FROM WalletTransactions wt
            JOIN Wallets w ON wt.WalletID = w.WalletID
            JOIN Vendors v ON w.UserID = v.UserID
            WHERE v.VendorID = ?
              AND wt.Type = 'SALE_REVENUE'
              AND wt.CreatedAt >= ?
              AND wt.CreatedAt < DATE_ADD(?, INTERVAL 1 DAY)
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
                SUM(wt.Amount) AS revenue
            FROM WalletTransactions wt
            JOIN Wallets w ON wt.WalletID = w.WalletID
            JOIN Vendors v ON w.UserID = v.UserID
            JOIN Orders o ON wt.ReferenceID = o.OrderID
            JOIN Products p ON o.ProductID = p.ProductID
            WHERE v.VendorID = ?
              AND wt.Type = 'SALE_REVENUE'
              AND wt.CreatedAt >= ?
              AND wt.CreatedAt < DATE_ADD(?, INTERVAL 1 DAY)
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
