package com.tallt.marketplace.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "SupportTickets")
@Getter
@Setter
public class SupportTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "TicketID")
    private Integer ticketId;

    // USER
    @ManyToOne
    @JoinColumn(name = "UserID", nullable = false)
    private User user;

    // VENDOR
    @ManyToOne
    @JoinColumn(name = "VendorID", nullable = false)
    private Vendor vendor;

    // ORDER
    @ManyToOne
    @JoinColumn(name = "OrderID")
    private Order order;

    @Column(name = "Subject")
    private String subject;

    @Column(name = "Description", columnDefinition = "LONGTEXT")
    private String description;

    @Column(name = "Status")
    private String status = "Open";

    @Column(name = "CreatedAt")
    private LocalDateTime createdAt;
    
}