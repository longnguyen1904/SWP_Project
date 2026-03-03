package com.tallt.marketplace.controller;

import java.security.Principal;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tallt.marketplace.dto.CreateTicketRequest;
import com.tallt.marketplace.entity.SupportTicket;
import com.tallt.marketplace.service.SupportTicketService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class SupportTicketController {

    private final SupportTicketService ticketService;

    // =========================================
    // CREATE TICKET
    // =========================================
    @PostMapping("/create")
    public ResponseEntity<?> createTicket(
            @RequestBody CreateTicketRequest request,
            Principal principal
    ) {

        // Lấy userId từ Security (JWT / Authentication)
        Integer userId = Integer.parseInt(principal.getName());

        SupportTicket ticket = ticketService.createTicket(
                userId,
                request.getVendorId(),
                request.getOrderId(),
                request.getSubject(),
                request.getDescription()
        );

        return ResponseEntity.ok(
                Map.of(
                        "message", "Ticket created successfully",
                        "ticketId", ticket.getTicketId()
                )
        );
    }
}