package com.tallt.marketplace.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.tallt.marketplace.repository.ReviewRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RevenueAnalyticsService {

    private final JdbcTemplate jdbcTemplate;
    private final ReviewRepository reviewRepository;

    /**
     * 🛡️ Giải mã Token lấy VendorID
     */
    public int getVendorIdFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Vui lòng đính kèm Token đăng nhập!");
        }
        try {
            String rawToken = authHeader.substring(7);
            // Giả định logic token của bạn là chuỗi có dạng "Prefix_UserID_..."
            int userId = Integer.parseInt(rawToken.split("_")[1]);
            String sql = "SELECT VendorID FROM Vendors WHERE UserID = ?";
            Integer vendorId = jdbcTemplate.queryForObject(sql, Integer.class, userId);
            if (vendorId == null) {
                throw new RuntimeException("Tài khoản này chưa được đăng ký làm Vendor!");
            }
            return vendorId;
        } catch (Exception e) {
            throw new RuntimeException("Không có quyền truy cập (Unauthorized)!");
        }
    }

    /**
     * 📊 Lấy Tổng quan Dashboard (Doanh thu, Đơn hàng, Rating, Tickets)
     */
    public Map<String, Object> getDashboardSummary(int vendorId, LocalDate startDate, LocalDate endDate, Integer productId) {

        // 1. Tính Doanh thu và Đơn hàng
        StringBuilder sql = new StringBuilder("""
            SELECT COALESCE(SUM(wt.Amount), 0) AS totalRevenue, COUNT(wt.TransactionID) AS totalOrders
            FROM WalletTransactions wt
            JOIN Wallets w ON wt.WalletID = w.WalletID
            JOIN Vendors v ON w.UserID = v.UserID
            JOIN Orders o ON wt.ReferenceID = o.OrderID
            WHERE v.VendorID = ? AND wt.Type = 'SALE_REVENUE'
              AND wt.CreatedAt >= ? AND wt.CreatedAt < DATE_ADD(?, INTERVAL 1 DAY)
        """);
        List<Object> params = new ArrayList<>(List.of(vendorId, startDate, endDate));
        if (productId != null) {
            sql.append(" AND o.ProductID = ?");
            params.add(productId);
        }

        Map<String, Object> dbResult = jdbcTemplate.queryForMap(sql.toString(), params.toArray());
        BigDecimal totalRevenue = new BigDecimal(dbResult.get("totalRevenue").toString());
        long totalOrders = ((Number) dbResult.get("totalOrders")).longValue();

        long days = ChronoUnit.DAYS.between(startDate, endDate) + 1;
        BigDecimal dailyAverage = totalRevenue.divide(BigDecimal.valueOf(days > 0 ? days : 1), 2, RoundingMode.HALF_UP);

        // 2. Tính Điểm đánh giá và Tổng số Review
        StringBuilder reviewSql = new StringBuilder("""
            SELECT COALESCE(AVG(r.Rating), 0) AS avgRating, COUNT(r.ReviewID) AS totalReviews
            FROM Reviews r 
            JOIN Products p ON r.ProductID = p.ProductID 
            WHERE p.VendorID = ?
        """);
        List<Object> revParams = new ArrayList<>(List.of(vendorId));
        if (productId != null) {
            reviewSql.append(" AND r.ProductID = ?");
            revParams.add(productId);
        }

        Map<String, Object> revResult = jdbcTemplate.queryForMap(reviewSql.toString(), revParams.toArray());
        Double vendorAvgRating = ((Number) revResult.get("avgRating")).doubleValue();
        long totalReviews = ((Number) revResult.get("totalReviews")).longValue();

        // 3. Tính Tổng số Ticket (Dùng LEFT JOIN theo yêu cầu)
        StringBuilder ticketSql = new StringBuilder("""
            SELECT COUNT(t.TicketID) AS totalTickets
            FROM SupportTickets t 
            LEFT JOIN Orders o ON t.OrderID = o.OrderID
            WHERE t.VendorID = ? 
              AND t.CreatedAt >= ? AND t.CreatedAt < DATE_ADD(?, INTERVAL 1 DAY)
        """);
        List<Object> tParams = new ArrayList<>(List.of(vendorId, startDate, endDate));
        if (productId != null) {
            ticketSql.append(" AND o.ProductID = ?");
            tParams.add(productId);
        }

        Long totalTickets = jdbcTemplate.queryForObject(ticketSql.toString(), Long.class, tParams.toArray());

        // 4. Trả về kết quả
        return Map.of(
            "totalRevenue", totalRevenue,
            "totalOrders", totalOrders,
            "dailyAverage", dailyAverage,
            "vendorAvgRating", Math.round(vendorAvgRating * 10.0) / 10.0,
            "totalReviews", totalReviews,
            "totalTickets", totalTickets != null ? totalTickets : 0
        );
    }

    /**
     * 📈 Doanh thu theo ngày (Cho biểu đồ Line Chart)
     */
/**
     * 📈 Doanh thu theo ngày (Cho biểu đồ Line Chart) - CÓ HỖ TRỢ LỌC THEO SẢN PHẨM
     */
    public List<Map<String, Object>> getDailyRevenue(int vendorId, LocalDate startDate, LocalDate endDate, Integer productId) {
        StringBuilder sql = new StringBuilder("""
            SELECT DATE(wt.CreatedAt) AS date, SUM(wt.Amount) AS revenue
            FROM WalletTransactions wt 
            JOIN Wallets w ON wt.WalletID = w.WalletID 
            JOIN Vendors v ON w.UserID = v.UserID
            JOIN Orders o ON wt.ReferenceID = o.OrderID
            WHERE v.VendorID = ? AND wt.Type = 'SALE_REVENUE' 
              AND wt.CreatedAt >= ? AND wt.CreatedAt < DATE_ADD(?, INTERVAL 1 DAY)
        """);
        
        List<Object> params = new ArrayList<>(List.of(vendorId, startDate, endDate));
        
        // Nếu Frontend có gửi productId lên thì nối thêm điều kiện WHERE
        if (productId != null) {
            sql.append(" AND o.ProductID = ?");
            params.add(productId);
        }
        
        sql.append(" GROUP BY DATE(wt.CreatedAt) ORDER BY DATE(wt.CreatedAt)");
        
        return jdbcTemplate.queryForList(sql.toString(), params.toArray());
    }

    /**
     * 🏆 Lấy danh sách Top Sản phẩm 
     * Lưu ý: Câu lệnh gốc của bạn dùng bảng phụ thuộc vào giao dịch thành công (WalletTransactions) 
     * nên nếu sản phẩm chưa phát sinh doanh thu sẽ không hiển thị.
     */
    public List<Map<String, Object>> getTopProducts(int vendorId, LocalDate startDate, LocalDate endDate) {
        String sql = """
            SELECT p.ProductID AS productId, p.ProductName AS productName, COALESCE(c.CategoryName, 'Chưa phân loại') AS categoryName,
                   SUM(wt.Amount) AS revenue, COUNT(wt.TransactionID) AS quantity
            FROM WalletTransactions wt 
            JOIN Wallets w ON wt.WalletID = w.WalletID 
            JOIN Vendors v ON w.UserID = v.UserID
            JOIN Orders o ON wt.ReferenceID = o.OrderID 
            JOIN Products p ON o.ProductID = p.ProductID 
            LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
            WHERE v.VendorID = ? AND wt.Type = 'SALE_REVENUE' 
              AND wt.CreatedAt >= ? AND wt.CreatedAt < DATE_ADD(?, INTERVAL 1 DAY)
            GROUP BY p.ProductID, p.ProductName, c.CategoryName 
            ORDER BY revenue DESC LIMIT 50
        """;
        
        List<Map<String, Object>> rawProducts = jdbcTemplate.queryForList(sql, vendorId, startDate, endDate);
        List<Map<String, Object>> enrichedProducts = new ArrayList<>();

        for (Map<String, Object> row : rawProducts) {
            Map<String, Object> mutableRow = new HashMap<>(row);
            Integer pId = ((Number) row.get("productId")).intValue();

            // Lấy Rating từ ReviewRepository
            Double avgRating = reviewRepository.getAverageRating(pId);
            mutableRow.put("avgRating", avgRating != null ? (Math.round(avgRating * 10.0) / 10.0) : 0.0);

            // Đếm số lượng Ticket của từng sản phẩm
            String tSql = """
                SELECT COUNT(t.TicketID) 
                FROM SupportTickets t 
                JOIN Orders o ON t.OrderID = o.OrderID 
                WHERE o.ProductID = ? 
                  AND t.CreatedAt >= ? AND t.CreatedAt < DATE_ADD(?, INTERVAL 1 DAY)
            """;
            Long tCount = jdbcTemplate.queryForObject(tSql, Long.class, pId, startDate, endDate);
            mutableRow.put("ticketCount", tCount != null ? tCount : 0);

            enrichedProducts.add(mutableRow);
        }
        return enrichedProducts;
    }

    /**
     * 🟢 Thống kê phân bổ sao đánh giá (1-5 sao)
     */
    public List<Map<String, Object>> getRatingDistribution(int vendorId, Integer productId) {
        StringBuilder sql = new StringBuilder("""
            SELECT r.Rating AS rating, COUNT(r.ReviewID) AS count
            FROM Reviews r
            JOIN Products p ON r.ProductID = p.ProductID
            WHERE p.VendorID = ?
        """);
        List<Object> params = new ArrayList<>(List.of(vendorId));
        if (productId != null) {
            sql.append(" AND r.ProductID = ?");
            params.add(productId);
        }
        sql.append(" GROUP BY r.Rating ORDER BY r.Rating DESC");
        return jdbcTemplate.queryForList(sql.toString(), params.toArray());
    }

    /**
     * 🟢 Lấy danh sách bình luận gần đây
     */
    public List<Map<String, Object>> getRecentReviews(int vendorId, Integer productId) {
        StringBuilder sql = new StringBuilder("""
            SELECT r.Rating AS rating, r.Comment AS comment, DATE(r.CreatedAt) AS reviewDate,
                   p.ProductName AS productName, r.UserID AS userId
            FROM Reviews r
            JOIN Products p ON r.ProductID = p.ProductID
            WHERE p.VendorID = ?
        """);
        List<Object> params = new ArrayList<>(List.of(vendorId));
        if (productId != null) {
            sql.append(" AND r.ProductID = ?");
            params.add(productId);
        }
        sql.append(" ORDER BY r.CreatedAt DESC LIMIT 15");
        return jdbcTemplate.queryForList(sql.toString(), params.toArray());
    }

    /**
     * 🟢 Thống kê Trạng thái Ticket (Open, Closed...)
     */
    public List<Map<String, Object>> getTicketStatusDistribution(int vendorId, LocalDate startDate, LocalDate endDate, Integer productId) {
        StringBuilder sql = new StringBuilder("""
            SELECT t.Status AS status, COUNT(t.TicketID) AS count
            FROM SupportTickets t 
            LEFT JOIN Orders o ON t.OrderID = o.OrderID
            WHERE t.VendorID = ? 
              AND t.CreatedAt >= ? AND t.CreatedAt < DATE_ADD(?, INTERVAL 1 DAY)
        """);
        List<Object> params = new ArrayList<>(List.of(vendorId, startDate, endDate));
        if (productId != null) {
            sql.append(" AND o.ProductID = ?");
            params.add(productId);
        }
        sql.append(" GROUP BY t.Status");
        return jdbcTemplate.queryForList(sql.toString(), params.toArray());
    }
}