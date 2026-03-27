package com.tallt.marketplace.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.format.annotation.DateTimeFormat;
import java.time.LocalDate;

import com.tallt.marketplace.entity.SupportTicket;
import com.tallt.marketplace.entity.TicketMessage;
import com.tallt.marketplace.service.CloudinaryService;
import com.tallt.marketplace.service.SupportTicketService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class SupportTicketController {

    private final SupportTicketService ticketService;
    private final CloudinaryService cloudinaryService;
    private final JdbcTemplate jdbcTemplate;

    // =========================================
    // 🛡️ HÀM BẢO MẬT: GIẢI MÃ TOKEN LẤY USER_ID
    // =========================================
    private Integer getUserIdFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Vui lòng đính kèm Token (Unauthorized)");
        }
        try {
            String rawToken = authHeader.substring(7);
            String[] parts = rawToken.split("_");
            return Integer.parseInt(parts[1]);
        } catch (Exception e) {
            throw new RuntimeException("Token sai định dạng!");
        }
    }

    // =========================================
    // 1. TẠO TICKET (LƯU TRÊN CLOUDINARY)
    // =========================================
    @PostMapping(value = "/create", consumes = {"multipart/form-data"})
    public ResponseEntity<?> createTicket(
            @RequestParam("vendorId") Integer vendorId,
            @RequestParam(value = "orderId", required = false) Integer orderId,
            @RequestParam("subject") String subject,
            @RequestParam("description") String description,
            @RequestParam(value = "priority", defaultValue = "Normal") String priority,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        try {
            Integer userId = getUserIdFromToken(authHeader);
            String attachmentUrl = null;

            if (file != null && !file.isEmpty()) {
                attachmentUrl = cloudinaryService.uploadFile(file, "marketplace/tickets");
            }

            SupportTicket ticket = ticketService.createTicket(userId, vendorId, orderId, subject, description);
            ticketService.addMessage(ticket.getTicketId(), userId, description, attachmentUrl);

            return ResponseEntity.ok(Map.of(
                    "message", "Ticket created successfully",
                    "ticketId", ticket.getTicketId(),
                    "fileUrl", attachmentUrl != null ? attachmentUrl : "No file"
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Lỗi Server: " + e.getMessage()));
        }
    }

    // =========================================
    // 2. LẤY DANH SÁCH TICKET (DÀNH CHO VENDOR)
    // =========================================
    @GetMapping("/vendor")
    public ResponseEntity<?> getVendorTickets(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Integer productId) {
        try {
            Integer userId = getUserIdFromToken(authHeader);

            // Dùng SQL JOIN để lấy productId chính xác (tránh lazy loading issues)
            StringBuilder sql = new StringBuilder("""
                SELECT t.TicketID AS ticketId, t.Subject AS subject, t.Status AS status,
                       u.FullName AS customerName, t.OrderID AS orderId,
                       p.ProductID AS productId, COALESCE(p.ProductName, 'N/A') AS productName,
                       t.CreatedAt AS createdAt,
                       COALESCE((SELECT MAX(CreatedAt) FROM TicketMessages WHERE TicketID = t.TicketID), t.CreatedAt) AS lastMessageAt
                FROM SupportTickets t
                JOIN Vendors v ON t.VendorID = v.VendorID
                JOIN Users vu ON v.UserID = vu.UserID
                LEFT JOIN Users u ON t.UserID = u.UserID
                LEFT JOIN Orders o ON t.OrderID = o.OrderID
                LEFT JOIN Products p ON o.ProductID = p.ProductID
                WHERE vu.UserID = ? AND t.OrderID IS NOT NULL
            """);
            List<Object> params = new ArrayList<>();
            params.add(userId);

            if (startDate != null && endDate != null) {
                sql.append(" AND t.CreatedAt >= ? AND t.CreatedAt < DATE_ADD(?, INTERVAL 1 DAY)");
                params.add(startDate);
                params.add(endDate);
            }

            if (productId != null) {
                sql.append(" AND p.ProductID = ?");
                params.add(productId);
            }
            sql.append(" ORDER BY t.CreatedAt DESC");

            List<Map<String, Object>> response = jdbcTemplate.queryForList(sql.toString(), params.toArray());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    // =========================================
    // 3. LẤY NỘI DUNG CHAT CỦA 1 TICKET
    // =========================================
    @GetMapping("/{ticketId}/messages")
    public ResponseEntity<?> getTicketMessages(
            @PathVariable Integer ticketId,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        try {
            getUserIdFromToken(authHeader);
            
            List<TicketMessage> messages = ticketService.getMessagesByTicket(ticketId);
            List<Map<String, Object>> response = new ArrayList<>();
            
            for(TicketMessage m : messages) {
                Map<String, Object> map = new HashMap<>();
                map.put("messageId", m.getMessageId());
                map.put("senderId", m.getSender() != null ? m.getSender().getUserID() : null);
                map.put("senderName", m.getSender() != null ? m.getSender().getFullName() : "Unknown");
                map.put("messageContent", m.getMessageContent());
                map.put("attachmentUrl", m.getAttachmentUrl());
                map.put("createdAt", m.getCreatedAt());
                response.add(map);
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // =========================================
    // 4. VENDOR GỬI TIN NHẮN PHẢN HỒI
    // =========================================
    @PostMapping(value = "/{ticketId}/reply", consumes = {"multipart/form-data"})
    public ResponseEntity<?> replyTicket(
            @PathVariable Integer ticketId,
            @RequestParam("content") String content,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        try {
            Integer userId = getUserIdFromToken(authHeader);
            String attachmentUrl = null;
            
            if (file != null && !file.isEmpty()) {
                attachmentUrl = cloudinaryService.uploadFile(file, "marketplace/tickets/replies");
            }
            
            ticketService.addMessage(ticketId, userId, content, attachmentUrl);
            
            return ResponseEntity.ok(Map.of(
                    "message", "Đã gửi phản hồi",
                    "fileUrl", attachmentUrl != null ? attachmentUrl : ""
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // =========================================
    // 5. CẬP NHẬT TRẠNG THÁI
    // =========================================
    @PutMapping("/{ticketId}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Integer ticketId,
            @RequestBody Map<String, String> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        try {
            Integer userId = getUserIdFromToken(authHeader); 
            String newStatus = body.get("status");
            
            if (newStatus == null || newStatus.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Trạng thái không được để trống"));
            }
            
            ticketService.updateStatus(ticketId, newStatus, userId);
            return ResponseEntity.ok(Map.of("message", "Đã cập nhật trạng thái thành " + newStatus));
        } catch (Exception e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }

    // =========================================
    // 6. LẤY DANH SÁCH TICKET (CUSTOMER)
    // =========================================
    @GetMapping("/customer")
    public ResponseEntity<?> getCustomerTickets(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            Integer userId = getUserIdFromToken(authHeader);
            List<SupportTicket> allTickets = ticketService.getAllTickets();
            List<Map<String, Object>> response = new ArrayList<>();
            
            for (SupportTicket t : allTickets) {
                if (t.getUser() != null && t.getUser().getUserID().equals(userId)) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("ticketId", t.getTicketId());
                    map.put("subject", t.getSubject());
                    map.put("status", t.getStatus());
                    String vendorName = (t.getVendor() != null && t.getVendor().getCompanyName() != null) 
                                        ? t.getVendor().getCompanyName() : "Người bán";
                    map.put("vendorName", vendorName);
                    map.put("orderId", t.getOrder() != null ? t.getOrder().getOrderID() : null);
                    map.put("createdAt", t.getCreatedAt());
                    
                    java.time.LocalDateTime lastMsgTime = t.getCreatedAt();
                    List<TicketMessage> msgs = ticketService.getMessagesByTicket(t.getTicketId());
                    if (msgs != null && !msgs.isEmpty()) {
                        for (TicketMessage msg : msgs) {
                            if (msg.getCreatedAt() != null && msg.getCreatedAt().isAfter(lastMsgTime)) {
                                lastMsgTime = msg.getCreatedAt();
                            }
                        }
                    }
                    map.put("lastMessageAt", lastMsgTime);
                    
                    response.add(map);
                }
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    // =========================================
    // 🆕 7. NEW: CHI TIẾT SẢN PHẨM/ĐƠN HÀNG
    // =========================================
    @GetMapping("/{ticketId}/product-details")
    public ResponseEntity<?> getTicketProductDetails(@PathVariable Integer ticketId) {
        try {
            return ResponseEntity.ok(ticketService.getOrderProductDetails(ticketId));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
}