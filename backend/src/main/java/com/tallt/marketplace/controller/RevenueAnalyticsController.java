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
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.tallt.marketplace.constant.RoleConstant;
import com.tallt.marketplace.entity.User;
import com.tallt.marketplace.entity.Vendor;
import com.tallt.marketplace.exception.AppException;
import com.tallt.marketplace.repository.UserRepository;
import com.tallt.marketplace.service.RevenueAnalyticsService;
import com.tallt.marketplace.service.VendorService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/vendor/revenue")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class RevenueAnalyticsController {

    private final RevenueAnalyticsService revenueService;
    private final VendorService vendorService;
    private final UserRepository userRepository;

    private int resolveVendorId(Integer vendorId, Integer userId) {
        if (userId == null) {
            throw new AppException("Missing X-User-Id");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("User không tồn tại"));

        int roleId = user.getRole().getRoleID();

        if (roleId == RoleConstant.ADMIN) {
            if (vendorId == null) {
                throw new AppException("Admin must provide vendorId");
            }
            return vendorId;
        }

        if (roleId != RoleConstant.VENDOR) {
            throw new AppException("Bạn không có quyền xem doanh thu vendor");
        }

        Vendor vendor = vendorService.getVendorByUserId(userId);
        int ownVendorId = vendor.getVendorID();

        if (vendorId != null && vendorId != ownVendorId) {
            throw new AppException("Bạn không có quyền xem doanh thu vendor khác");
        }

        return ownVendorId;
    }

    /**
     * 🔢 Tổng doanh thu
     * GET /api/vendor/revenue/summary
     */
    @GetMapping("/summary")
    public ResponseEntity<BigDecimal> getTotalRevenue(
            @RequestParam(value = "vendorId", required = false) Integer vendorId,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestParam("startDate")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam("endDate")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate
    ) {
        int resolvedVendorId = resolveVendorId(vendorId, userId);
        BigDecimal totalRevenue =
                revenueService.getTotalRevenueByVendor(
                        resolvedVendorId, startDate, endDate);

        return ResponseEntity.ok(totalRevenue);
    }

    /**
     * 📈 Doanh thu theo ngày (chart)
     * GET /api/vendor/revenue/daily
     */
    @GetMapping("/daily")
    public ResponseEntity<List<Map<String, Object>>> getDailyRevenue(
            @RequestParam(value = "vendorId", required = false) Integer vendorId,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestParam("startDate")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam("endDate")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate
    ) {
        int resolvedVendorId = resolveVendorId(vendorId, userId);

        return ResponseEntity.ok(
                revenueService.getDailyRevenue(
                        resolvedVendorId, startDate, endDate
                )
        );
    }

    /**
     * 🏆 Top sản phẩm bán chạy
     * GET /api/vendor/revenue/top-products
     */
    @GetMapping("/top-products")
    public ResponseEntity<List<Map<String, Object>>> getTopProducts(
            @RequestParam(value = "vendorId", required = false) Integer vendorId,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestParam("startDate")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam("endDate")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate
    ) {
        int resolvedVendorId = resolveVendorId(vendorId, userId);

        return ResponseEntity.ok(
                revenueService.getTopProducts(
                        resolvedVendorId, startDate, endDate
                )
        );
    }

    /**
     * 📥 Export CSV doanh thu theo ngày
     * GET /api/vendor/revenue/export
     */
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportRevenueCSV(
            @RequestParam(value = "vendorId", required = false) Integer vendorId,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate
    ) {
        int resolvedVendorId = resolveVendorId(vendorId, userId);
        List<Map<String, Object>> data = revenueService.getDailyRevenue(
                resolvedVendorId, startDate, endDate
        );

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
