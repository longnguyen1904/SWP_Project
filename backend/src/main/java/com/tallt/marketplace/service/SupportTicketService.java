package com.tallt.marketplace.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tallt.marketplace.entity.Order;
import com.tallt.marketplace.entity.SupportTicket;
import com.tallt.marketplace.entity.TicketMessage;
import com.tallt.marketplace.entity.User;
import com.tallt.marketplace.entity.Vendor;
import com.tallt.marketplace.repository.OrderRepository;
import com.tallt.marketplace.repository.SupportTicketRepository;
import com.tallt.marketplace.repository.TicketMessageRepository;
import com.tallt.marketplace.repository.UserRepository;
import com.tallt.marketplace.repository.VendorRepository;

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

    // =====================================================
    // CREATE TICKET
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
    // ADD MESSAGE
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
    // GET TICKET
    // =====================================================
    @Transactional(readOnly = true)
    public SupportTicket getTicketById(Integer ticketId) {
        return ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
    }

    // =====================================================
    // GET ALL TICKETS
    // =====================================================
    @Transactional(readOnly = true)
    public List<SupportTicket> getAllTickets() {
        return ticketRepository.findAll();
    }

    // =====================================================
    // GET MESSAGES BY TICKET (TỐI ƯU)
    // =====================================================
    @Transactional(readOnly = true)
    public List<TicketMessage> getMessagesByTicket(Integer ticketId) {

        // kiểm tra ticket tồn tại
        if (!ticketRepository.existsById(ticketId)) {
            throw new RuntimeException("Ticket not found");
        }

        return messageRepository.findByTicketTicketId(ticketId);
    }

    // =====================================================
    // UPDATE STATUS
    // =====================================================
    public SupportTicket updateStatus(Integer ticketId, String status) {

        SupportTicket ticket = getTicketById(ticketId);
        ticket.setStatus(status);

        return ticketRepository.save(ticket);
    }

    // =====================================================
    // DELETE TICKET
    // =====================================================
    public void deleteTicket(Integer ticketId) {

        SupportTicket ticket = getTicketById(ticketId);
        ticketRepository.delete(ticket);
    }
}