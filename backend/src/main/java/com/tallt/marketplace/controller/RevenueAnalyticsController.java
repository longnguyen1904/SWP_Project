package com.tallt.marketplace.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
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

    /**
     * 🔢 Tổng doanh thu
     * GET /api/vendor/revenue/summary
     */
    @GetMapping("/summary")
    public ResponseEntity<BigDecimal> getTotalRevenue(
            @RequestParam("vendorId") int vendorId,
            @RequestParam("startDate")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam("endDate")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate
    ) {
        BigDecimal totalRevenue =
                revenueService.getTotalRevenueByVendor(
                        vendorId, startDate, endDate);

        return ResponseEntity.ok(totalRevenue);
    }

    /**
     * 📈 Doanh thu theo ngày (chart)
     * GET /api/vendor/revenue/daily
     */
    @GetMapping("/daily")
    public ResponseEntity<List<Map<String, Object>>> getDailyRevenue(
            @RequestParam("vendorId") int vendorId,
            @RequestParam("startDate")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam("endDate")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate
    ) {

        return ResponseEntity.ok(
                revenueService.getDailyRevenue(
                        vendorId, startDate, endDate
                )
        );
    }

    /**
     * 🏆 Top sản phẩm bán chạy
     * GET /api/vendor/revenue/top-products
     */
    @GetMapping("/top-products")
    public ResponseEntity<List<Map<String, Object>>> getTopProducts(
            @RequestParam("vendorId") int vendorId,
            @RequestParam("startDate")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam("endDate")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate
    ) {

        return ResponseEntity.ok(
                revenueService.getTopProducts(
                        vendorId, startDate, endDate
                )
        );
    }

    /**
     * 📥 Export CSV doanh thu theo ngày
     * GET /api/vendor/revenue/export
     */
   @GetMapping("/export")
public ResponseEntity<byte[]> exportRevenueCSV(
        @RequestParam int vendorId,
        @RequestParam
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        LocalDate startDate,
        @RequestParam
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        LocalDate endDate
) 
{

    List<Map<String, Object>> data =
            revenueService.getDailyRevenue(
                    vendorId, startDate, endDate);

    StringBuilder csv = new StringBuilder();
    csv.append("Date,Revenue\n");

    for (Map<String, Object> row : data) {
        csv.append(row.get("date"))
           .append(",")
           .append(row.get("revenue"))
           .append("\n");
    }

    byte[] csvBytes = csv.toString().getBytes();

    return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=revenue.csv")
            .header(HttpHeaders.CONTENT_TYPE, "text/csv")
            .body(csvBytes);
}

}
