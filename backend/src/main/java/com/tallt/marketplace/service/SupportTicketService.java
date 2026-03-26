package com.tallt.marketplace.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tallt.marketplace.entity.Order;
import com.tallt.marketplace.entity.Product;
import com.tallt.marketplace.entity.ProductVersion;
import com.tallt.marketplace.entity.SupportTicket;
import com.tallt.marketplace.entity.TicketMessage;
import com.tallt.marketplace.entity.User;
import com.tallt.marketplace.entity.Vendor;
import com.tallt.marketplace.repository.OrderRepository;
import com.tallt.marketplace.repository.SupportTicketRepository;
import com.tallt.marketplace.repository.TicketMessageRepository;
import com.tallt.marketplace.repository.UserRepository;
import com.tallt.marketplace.repository.VendorRepository;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class SupportTicketService {

    private final SupportTicketRepository ticketRepository;
    private final TicketMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final VendorRepository vendorRepository;
    private final OrderRepository orderRepository;
    private final EntityManager entityManager; // Thêm EntityManager để query version

    // =====================================================
    // CREATE TICKET (GIỮ NGUYÊN)
    // =====================================================
    public SupportTicket createTicket(
            Integer userId,
            Integer vendorId,
            Integer orderId,
            String subject,
            String description) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new RuntimeException("Vendor not found"));

        Order order = null;
        if (orderId != null) {
            order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));
        }

        SupportTicket ticket = new SupportTicket();
        ticket.setUser(user);
        ticket.setVendor(vendor);
        ticket.setOrder(order);
        ticket.setSubject(subject);
        ticket.setDescription(description);
        ticket.setStatus("Open");
        ticket.setCreatedAt(LocalDateTime.now());

        return ticketRepository.save(ticket);
    }

    // =====================================================
    // ADD MESSAGE (GIỮ NGUYÊN)
    // =====================================================
    public TicketMessage addMessage(
            Integer ticketId,
            Integer senderId,
            String content,
            String attachmentUrl) {

        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        TicketMessage message = new TicketMessage();
        message.setTicket(ticket);
        message.setSender(sender);
        message.setMessageContent(content);
        message.setAttachmentUrl(attachmentUrl);
        message.setCreatedAt(LocalDateTime.now());

        return messageRepository.save(message);
    }

    // =====================================================
    // GET TICKET (GIỮ NGUYÊN)
    // =====================================================
    @Transactional(readOnly = true)
    public SupportTicket getTicketById(Integer ticketId) {
        return ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
    }

    // =====================================================
    // GET ALL TICKETS (GIỮ NGUYÊN)
    // =====================================================
    @Transactional(readOnly = true)
    public List<SupportTicket> getAllTickets() {
        return ticketRepository.findAll();
    }

    // =====================================================
    // GET MESSAGES BY TICKET (GIỮ NGUYÊN)
    // =====================================================
    @Transactional(readOnly = true)
    public List<TicketMessage> getMessagesByTicket(Integer ticketId) {

        if (!ticketRepository.existsById(ticketId)) {
            throw new RuntimeException("Ticket not found");
        }

        return messageRepository.findByTicketTicketId(ticketId);
    }

    // =====================================================
    // UPDATE STATUS (GIỮ NGUYÊN)
    // =====================================================
    public SupportTicket updateStatus(Integer ticketId, String status, Integer requestingUserId) {
        SupportTicket ticket = getTicketById(ticketId);

        if ("Closed".equalsIgnoreCase(status)) {
            if (!ticket.getUser().getUserID().equals(requestingUserId)) {
                throw new RuntimeException("Chỉ Khách hàng (người tạo) mới có quyền Đóng Ticket!");
            }
        }

        ticket.setStatus(status);
        return ticketRepository.save(ticket);
    }

    // =====================================================
    // DELETE TICKET (GIỮ NGUYÊN)
    // =====================================================
    public void deleteTicket(Integer ticketId) {
        SupportTicket ticket = getTicketById(ticketId);
        ticketRepository.delete(ticket);
    }

    // =====================================================
    // 🆕 NEW: LẤY CHI TIẾT SẢN PHẨM & ĐƠN HÀNG TỪ TICKET
    // =====================================================
    @Transactional(readOnly = true)
    public Map<String, Object> getOrderProductDetails(Integer ticketId) {
        SupportTicket ticket = getTicketById(ticketId);
        Order order = ticket.getOrder();

        if (order == null) {
            throw new RuntimeException("Ticket không có đơn hàng liên kết.");
        }

        Product p = order.getProduct();
        Map<String, Object> map = new HashMap<>();
        
        // 1. Dữ liệu từ bảng Orders
        map.put("orderTotalAmount", order.getTotalAmount());
        map.put("orderPaymentStatus", order.getPaymentStatus());
        map.put("licenseTier", order.getTier() != null ? order.getTier().getTierName() : "N/A");
        
        // 2. Dữ liệu từ bảng Products
        map.put("productName", p.getProductName());

        // 3. Truy vấn Version mới nhất từ bảng ProductVersions
        List<ProductVersion> versions = entityManager.createQuery(
            "SELECT v FROM ProductVersion v WHERE v.product.productID = :pid ORDER BY v.createdAt DESC", ProductVersion.class)
            .setParameter("pid", p.getProductID())
            .getResultList();

        if (!versions.isEmpty()) {
            ProductVersion latest = versions.get(0);
            map.put("versionNumber", latest.getVersionNumber());
            map.put("releaseNotes", latest.getReleaseNotes());
        } else {
            map.put("versionNumber", "N/A");
            map.put("releaseNotes", "Chưa có phiên bản nào");
        }

        return map;
    }
}