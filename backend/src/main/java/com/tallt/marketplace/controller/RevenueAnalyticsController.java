package com.tallt.marketplace.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
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

    // 🔥 API MỚI BỔ SUNG CHO TICKET STATUS
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
}