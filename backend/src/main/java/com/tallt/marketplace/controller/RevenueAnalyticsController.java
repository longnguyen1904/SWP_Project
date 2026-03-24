package com.tallt.marketplace.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.tallt.marketplace.service.RevenueAnalyticsService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/vendor/revenue")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class RevenueAnalyticsController {

    private final RevenueAnalyticsService revenueService;

    @GetMapping("/summary")
    public ResponseEntity<?> getDashboardSummary(
            @RequestHeader(value = "Authorization", required = false) String token,
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Integer productId) {
        try {
            int vendorId = revenueService.getVendorIdFromToken(token);
            return ResponseEntity.ok(revenueService.getDashboardSummary(vendorId, startDate, endDate, productId));
        } catch (Exception e) { 
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage())); 
        }
    }

 @GetMapping("/daily")
    public ResponseEntity<?> getDailyRevenue(
            @RequestHeader(value = "Authorization", required = false) String token,
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Integer productId) { // Thêm dòng này
        try {
            int vendorId = revenueService.getVendorIdFromToken(token);
            // Truyền thêm productId vào service
            return ResponseEntity.ok(revenueService.getDailyRevenue(vendorId, startDate, endDate, productId));
        } catch (Exception e) { 
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage())); 
        }
    }

    @GetMapping("/top-products")
    public ResponseEntity<?> getTopProducts(
            @RequestHeader(value = "Authorization", required = false) String token,
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            int vendorId = revenueService.getVendorIdFromToken(token);
            return ResponseEntity.ok(revenueService.getTopProducts(vendorId, startDate, endDate));
        } catch (Exception e) { 
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage())); 
        }
    }

    @GetMapping("/rating-distribution")
    public ResponseEntity<?> getRatingDistribution(
            @RequestHeader(value = "Authorization", required = false) String token,
            @RequestParam(required = false) Integer productId) {
        try {
            int vendorId = revenueService.getVendorIdFromToken(token);
            return ResponseEntity.ok(revenueService.getRatingDistribution(vendorId, productId));
        } catch (Exception e) { 
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage())); 
        }
    }

    @GetMapping("/recent-reviews")
    public ResponseEntity<?> getRecentReviews(
            @RequestHeader(value = "Authorization", required = false) String token,
            @RequestParam(required = false) Integer productId) {
        try {
            int vendorId = revenueService.getVendorIdFromToken(token);
            return ResponseEntity.ok(revenueService.getRecentReviews(vendorId, productId));
        } catch (Exception e) { 
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage())); 
        }
    }

    // API MỚI BỔ SUNG CHO TICKET STATUS
    @GetMapping("/ticket-status")
    public ResponseEntity<?> getTicketStatusDistribution(
            @RequestHeader(value = "Authorization", required = false) String token,
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Integer productId) {
        try {
            int vendorId = revenueService.getVendorIdFromToken(token);
            return ResponseEntity.ok(revenueService.getTicketStatusDistribution(vendorId, startDate, endDate, productId));
        } catch (Exception e) { 
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage())); 
        }
    }

   @GetMapping("/export")
    public ResponseEntity<?> exportRevenueCSV(
            @RequestHeader(value = "Authorization", required = false) String token,
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Integer productId) { // Thêm dòng này
        try {
            int vendorId = revenueService.getVendorIdFromToken(token);
            // Truyền thêm productId vào service
            List<Map<String, Object>> data = revenueService.getDailyRevenue(vendorId, startDate, endDate, productId);

            StringBuilder csv = new StringBuilder();
            csv.append("Date,Revenue\n");
            for (Map<String, Object> row : data) {
                csv.append(row.get("date")).append(",").append(row.get("revenue")).append("\n");
            }
            byte[] csvBytes = csv.toString().getBytes();

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=revenue_report.csv")
                    .header(HttpHeaders.CONTENT_TYPE, "text/csv")
                    .body(csvBytes);

        } catch (Exception e) { 
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage())); 
        }
    }
/**
     * 📖 API Lấy danh sách Sổ cái giao dịch với bộ lọc nâng cao
     */
    @GetMapping("/ledger")
    public ResponseEntity<?> getLedgerTransactions(
            @RequestHeader(value = "Authorization", required = false) String token,
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer productId,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(defaultValue = "date_desc") String sortBy) { // Mặc định sắp xếp ngày giảm dần
        try {
            // 1. Lấy VendorID từ Token
            int vendorId = revenueService.getVendorIdFromToken(token);
            
            // 2. Gọi Service với đầy đủ các tham số lọc
            List<Map<String, Object>> transactions = revenueService.getLedgerTransactions(
                vendorId, startDate, endDate, search, productId, minPrice, maxPrice, sortBy
            );
            
            return ResponseEntity.ok(transactions);
        } catch (Exception e) { 
            // Trả về lỗi 401 nếu token sai hoặc lỗi logic
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage())); 
        }
    }

    // API Tải hóa đơn PDF
@GetMapping("/export-invoice/{transactionId}")
    public ResponseEntity<byte[]> exportInvoicePdf(
            @RequestHeader(value = "Authorization", required = false) String token,
            @PathVariable("transactionId") int transactionId) {
        try {
            int vendorId = revenueService.getVendorIdFromToken(token);
            byte[] pdfBytes = revenueService.exportInvoicePdf(vendorId, transactionId);

            return ResponseEntity.ok()
                    // XÓA HOẶC COMMENT DÒNG CONTENT_DISPOSITION NÀY:
                    // .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Invoice.pdf") 
                    .header(HttpHeaders.CONTENT_TYPE, "application/pdf")
                    .body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(null);
        }
    }
    
}