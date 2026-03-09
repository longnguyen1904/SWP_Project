package com.tallt.marketplace.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

import com.tallt.marketplace.entity.SupportTicket;
import com.tallt.marketplace.entity.TicketMessage;
import com.tallt.marketplace.service.SupportTicketService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class SupportTicketController {

    private final SupportTicketService ticketService;

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
    // 1. TẠO TICKET (DÀNH CHO KHÁCH HÀNG)
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
                String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
                java.nio.file.Path uploadPath = java.nio.file.Paths.get("uploads");
                
                if (!java.nio.file.Files.exists(uploadPath)) {
                    java.nio.file.Files.createDirectories(uploadPath);
                }
                
                java.nio.file.Path filePath = uploadPath.resolve(fileName);
                java.nio.file.Files.copy(file.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                attachmentUrl = "/uploads/" + fileName;
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
    public ResponseEntity<?> getVendorTickets(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            Integer userId = getUserIdFromToken(authHeader);
            
            // Lấy toàn bộ ticket và tự động lọc ra ticket của Vendor đang đăng nhập
            List<SupportTicket> allTickets = ticketService.getAllTickets();
            List<Map<String, Object>> response = new ArrayList<>();
            
            for (SupportTicket t : allTickets) {
                // Kiểm tra ticket này có thuộc về User (đang đóng vai trò Vendor) này không
                if (t.getVendor() != null && t.getVendor().getUser() != null && t.getVendor().getUser().getUserID().equals(userId)) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("ticketId", t.getTicketId());
                    map.put("subject", t.getSubject());
                    map.put("status", t.getStatus());
                    map.put("customerName", t.getUser() != null ? t.getUser().getFullName() : "Khách hàng");
                    map.put("orderId", t.getOrder() != null ? t.getOrder().getOrderID() : null);
                    map.put("createdAt", t.getCreatedAt());
                    response.add(map);
                }
            }
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
            getUserIdFromToken(authHeader); // Chặn nếu chưa đăng nhập
            
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
                String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
                java.nio.file.Path uploadPath = java.nio.file.Paths.get("uploads");
                if (!java.nio.file.Files.exists(uploadPath)) {
                    java.nio.file.Files.createDirectories(uploadPath);
                }
                java.nio.file.Path filePath = uploadPath.resolve(fileName);
                java.nio.file.Files.copy(file.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                attachmentUrl = "/uploads/" + fileName;
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
    // 5. CẬP NHẬT TRẠNG THÁI (ĐÓNG/MỞ TICKET)
    // =========================================
    @PutMapping("/{ticketId}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Integer ticketId,
            @RequestBody Map<String, String> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        try {
            Integer userId = getUserIdFromToken(authHeader); // Lấy ID người đang thao tác
            String newStatus = body.get("status");
            
            if (newStatus == null || newStatus.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Trạng thái không được để trống"));
            }
            
            // Truyền thêm userId vào để Service kiểm tra quyền
            ticketService.updateStatus(ticketId, newStatus, userId);
            return ResponseEntity.ok(Map.of("message", "Đã cập nhật trạng thái thành " + newStatus));
        } catch (Exception e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }
    // =========================================
    // LẤY DANH SÁCH TICKET CỦA KHÁCH HÀNG (CUSTOMER)
    // =========================================
    @GetMapping("/customer")
    public ResponseEntity<?> getCustomerTickets(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            Integer userId = getUserIdFromToken(authHeader);
            
            // Lấy toàn bộ ticket và tự động lọc ra ticket do Khách hàng này tạo
            List<SupportTicket> allTickets = ticketService.getAllTickets();
            List<Map<String, Object>> response = new ArrayList<>();
            
            for (SupportTicket t : allTickets) {
                // Kiểm tra ticket này có phải do User (Khách hàng) này tạo không
                if (t.getUser() != null && t.getUser().getUserID().equals(userId)) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("ticketId", t.getTicketId());
                    map.put("subject", t.getSubject());
                    map.put("status", t.getStatus());
                    // Trả về tên Vendor (Tên công ty hoặc tên người bán) để Khách hàng biết đang chat với ai
                    String vendorName = (t.getVendor() != null && t.getVendor().getCompanyName() != null) 
                                        ? t.getVendor().getCompanyName() 
                                        : "Người bán";
                    map.put("vendorName", vendorName);
                    map.put("orderId", t.getOrder() != null ? t.getOrder().getOrderID() : null);
                    map.put("createdAt", t.getCreatedAt());
                    response.add(map);
                }
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }
}