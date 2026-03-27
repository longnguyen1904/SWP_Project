package com.tallt.marketplace.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import java.io.ByteArrayOutputStream;
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
     * ĐÃ CHUYỂN: Query trực tiếp từ bảng Orders thay vì WalletTransactions
     */
    public Map<String, Object> getDashboardSummary(int vendorId, LocalDate startDate, LocalDate endDate, Integer productId) {

        // 1. Tính Doanh thu và Đơn hàng — LẤY TỪ ORDERS
        StringBuilder sql = new StringBuilder("""
            SELECT COALESCE(SUM(o.totalAmount), 0) AS totalRevenue, COUNT(o.OrderID) AS totalOrders
            FROM Orders o
            JOIN Products p ON o.ProductID = p.ProductID
            WHERE p.VendorID = ?
              AND UPPER(o.paymentStatus) IN ('PAID','COMPLETED','SUCCESS')
              AND o.CreatedAt >= ? AND o.CreatedAt < DATE_ADD(?, INTERVAL 1 DAY)
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

        // 3. Tính Tổng số Ticket
        StringBuilder ticketSql = new StringBuilder("""
            SELECT COUNT(t.TicketID) AS totalTickets
            FROM SupportTickets t 
            LEFT JOIN Orders o ON t.OrderID = o.OrderID
            WHERE t.VendorID = ? 
              AND t.OrderID IS NOT NULL
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
     * ĐÃ CHUYỂN: Query trực tiếp từ bảng Orders
     */
    public List<Map<String, Object>> getDailyRevenue(int vendorId, LocalDate startDate, LocalDate endDate, Integer productId) {
        StringBuilder sql = new StringBuilder("""
            SELECT DATE(o.CreatedAt) AS date, SUM(o.totalAmount) AS revenue
            FROM Orders o
            JOIN Products p ON o.ProductID = p.ProductID
            WHERE p.VendorID = ?
              AND UPPER(o.paymentStatus) IN ('PAID','COMPLETED','SUCCESS')
              AND o.CreatedAt >= ? AND o.CreatedAt < DATE_ADD(?, INTERVAL 1 DAY)
        """);
        
        List<Object> params = new ArrayList<>(List.of(vendorId, startDate, endDate));
        
        if (productId != null) {
            sql.append(" AND o.ProductID = ?");
            params.add(productId);
        }
        
        sql.append(" GROUP BY DATE(o.CreatedAt) ORDER BY DATE(o.CreatedAt)");
        
        return jdbcTemplate.queryForList(sql.toString(), params.toArray());
    }

    /**
     * 🏆 Lấy danh sách Top Sản phẩm
     * ĐÃ CHUYỂN: Query trực tiếp từ bảng Orders thay vì WalletTransactions
     */
    public List<Map<String, Object>> getTopProducts(int vendorId, LocalDate startDate, LocalDate endDate) {
        String sql = """
            SELECT p.ProductID AS productId, p.ProductName AS productName, 
                   COALESCE(c.CategoryName, 'Chưa phân loại') AS categoryName,
                   COALESCE(SUM(o.totalAmount), 0) AS revenue, COUNT(o.OrderID) AS quantity
            FROM Products p
            LEFT JOIN Orders o ON p.ProductID = o.ProductID
                 AND UPPER(o.paymentStatus) IN ('PAID','COMPLETED','SUCCESS')
                 AND o.CreatedAt >= ? AND o.CreatedAt < DATE_ADD(?, INTERVAL 1 DAY)
            LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
            WHERE p.VendorID = ?
            GROUP BY p.ProductID, p.ProductName, c.CategoryName 
            ORDER BY revenue DESC, quantity DESC LIMIT 50
        """;
        
        List<Map<String, Object>> rawProducts = jdbcTemplate.queryForList(sql, startDate, endDate, vendorId);
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

            // Đếm số lượng Ticket ĐÃ GIẢI QUYẾT (Resolved, Closed) của từng sản phẩm
            String tResolvedSql = """
                SELECT COUNT(t.TicketID) 
                FROM SupportTickets t 
                JOIN Orders o ON t.OrderID = o.OrderID 
                WHERE o.ProductID = ? 
                  AND t.Status IN ('Resolved', 'Closed')
                  AND t.CreatedAt >= ? AND t.CreatedAt < DATE_ADD(?, INTERVAL 1 DAY)
            """;
            Long tResolvedCount = jdbcTemplate.queryForObject(tResolvedSql, Long.class, pId, startDate, endDate);
            mutableRow.put("resolvedTicketCount", tResolvedCount != null ? tResolvedCount : 0);

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
              AND t.OrderID IS NOT NULL
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
    /**
     * 📖 Lấy danh sách Sổ cái giao dịch (Transaction Ledger)
     */
    public List<Map<String, Object>> getLedgerTransactions(int vendorId, LocalDate startDate, LocalDate endDate, String search) {
        StringBuilder sql = new StringBuilder("""
            SELECT 
                wt.TransactionID AS transactionId,
                o.OrderID AS orderId,
                p.ProductName AS productName,
                u.FullName AS customerName,
                u.Email AS customerEmail,
                DATE_FORMAT(wt.CreatedAt, '%d/%m/%Y %H:%i') AS transactionDate,
                o.TotalAmount AS grossAmount,
                wt.Amount AS netAmount,
                (o.TotalAmount - wt.Amount) AS platformFee
            FROM WalletTransactions wt
            JOIN Wallets w ON wt.WalletID = w.WalletID
            JOIN Vendors v ON w.UserID = v.UserID
            JOIN Orders o ON wt.ReferenceID = o.OrderID
            JOIN Products p ON o.ProductID = p.ProductID
            JOIN Users u ON o.UserID = u.UserID
            WHERE v.VendorID = ? 
              AND wt.Type = 'SALE_REVENUE'
              AND wt.CreatedAt >= ? AND wt.CreatedAt < DATE_ADD(?, INTERVAL 1 DAY)
        """);

        List<Object> params = new ArrayList<>(List.of(vendorId, startDate, endDate));

        if (search != null && !search.trim().isEmpty()) {
            sql.append(" AND (p.ProductName LIKE ? OR o.OrderID LIKE ? OR u.FullName LIKE ?)");
            String searchParam = "%" + search + "%";
            params.addAll(List.of(searchParam, searchParam, searchParam));
        }

        sql.append(" ORDER BY wt.CreatedAt DESC");
        return jdbcTemplate.queryForList(sql.toString(), params.toArray());
    }

    /**
     * 📄 Tạo Hóa đơn điện tử PDF cho 1 giao dịch
     */
    public byte[] exportInvoicePdf(int vendorId, int transactionId) {
        // 1. Lấy thông tin giao dịch
        String sql = """
            SELECT o.OrderID, p.ProductName, u.FullName, wt.CreatedAt, o.TotalAmount, wt.Amount
            FROM WalletTransactions wt
            JOIN Wallets w ON wt.WalletID = w.WalletID
            JOIN Vendors v ON w.UserID = v.UserID
            JOIN Orders o ON wt.ReferenceID = o.OrderID
            JOIN Products p ON o.ProductID = p.ProductID
            JOIN Users u ON o.UserID = u.UserID
            WHERE v.VendorID = ? AND wt.TransactionID = ? AND wt.Type = 'SALE_REVENUE'
        """;
        
        Map<String, Object> data = jdbcTemplate.queryForMap(sql, vendorId, transactionId);

        // 2. Tạo PDF bằng OpenPDF
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = new Font(Font.HELVETICA, 20, Font.BOLD);
            Font normalFont = new Font(Font.HELVETICA, 12, Font.NORMAL);
            Font boldFont = new Font(Font.HELVETICA, 12, Font.BOLD);

            Paragraph title = new Paragraph("ELECTRONIC INVOICE / RECEIPT", titleFont);
            title.setAlignment(Paragraph.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            document.add(new Paragraph("Transaction ID: TCK-" + transactionId, normalFont));
            document.add(new Paragraph("Order ID: #" + data.get("OrderID"), normalFont));
            document.add(new Paragraph("Date: " + data.get("CreatedAt"), normalFont));
            document.add(new Paragraph("Customer: " + data.get("FullName"), normalFont));
            
            document.add(new Paragraph("\n--------------------------------------------------\n", normalFont));
            document.add(new Paragraph("Product: " + data.get("ProductName"), boldFont));
            document.add(new Paragraph("\nGross Amount (Customer Paid): " + data.get("TotalAmount") + " VND", normalFont));
            
            BigDecimal gross = (BigDecimal) data.get("TotalAmount");
            BigDecimal net = (BigDecimal) data.get("Amount");
            BigDecimal fee = gross.subtract(net);
            
            document.add(new Paragraph("Platform Fee Deducted: -" + fee + " VND", normalFont));
            document.add(new Paragraph("\nNet Profit (Vendor Received): " + net + " VND", boldFont));
            document.add(new Paragraph("\n--------------------------------------------------\n", normalFont));
            
            Paragraph footer = new Paragraph("Thank you for using Global Software Marketplace!", normalFont);
            footer.setAlignment(Paragraph.ALIGN_CENTER);
            document.add(footer);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo PDF: " + e.getMessage());
        }
    }
    public List<Map<String, Object>> getLedgerTransactions(int vendorId, LocalDate startDate, LocalDate endDate, 
                                                         String search, Integer productId, 
                                                         Double minPrice, Double maxPrice, String sortBy) {
        StringBuilder sql = new StringBuilder("""
            SELECT 
                wt.TransactionID AS transactionId, o.OrderID AS orderId,
                p.ProductName AS productName, u.FullName AS customerName,
                u.Email AS customerEmail, wt.CreatedAt AS transactionDate,
                o.TotalAmount AS grossAmount, wt.Amount AS netAmount,
                (o.TotalAmount - wt.Amount) AS platformFee
            FROM WalletTransactions wt
            JOIN Orders o ON wt.ReferenceID = o.OrderID
            JOIN Products p ON o.ProductID = p.ProductID
            JOIN Users u ON o.UserID = u.UserID
            JOIN Wallets w ON wt.WalletID = w.WalletID
            JOIN Vendors v ON w.UserID = v.UserID
            WHERE v.VendorID = ? AND wt.Type = 'SALE_REVENUE'
              AND wt.CreatedAt >= ? AND wt.CreatedAt < DATE_ADD(?, INTERVAL 1 DAY)
        """);

        List<Object> params = new ArrayList<>(List.of(vendorId, startDate, endDate));

        if (search != null && !search.isEmpty()) {
            sql.append(" AND (p.ProductName LIKE ? OR o.OrderID LIKE ? OR u.FullName LIKE ?)");
            params.add("%" + search + "%"); params.add("%" + search + "%"); params.add("%" + search + "%");
        }
        if (productId != null) { sql.append(" AND p.ProductID = ?"); params.add(productId); }
        if (minPrice != null) { sql.append(" AND o.TotalAmount >= ?"); params.add(minPrice); }
        if (maxPrice != null) { sql.append(" AND o.TotalAmount <= ?"); params.add(maxPrice); }

        // Xử lý sắp xếp
        String orderSql = switch (sortBy) {
            case "price_desc" -> " ORDER BY o.TotalAmount DESC";
            case "price_asc" -> " ORDER BY o.TotalAmount ASC";
            case "date_asc" -> " ORDER BY wt.CreatedAt ASC";
            default -> " ORDER BY wt.CreatedAt DESC";
        };
        sql.append(orderSql);

        return jdbcTemplate.queryForList(sql.toString(), params.toArray());
    }
}