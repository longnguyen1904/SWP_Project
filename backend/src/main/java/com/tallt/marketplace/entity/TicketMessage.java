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
@Table(name = "TicketMessages")
@Getter
@Setter
public class TicketMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MessageID")
    private Integer messageId;

    // TICKET
    @ManyToOne
    @JoinColumn(name = "TicketID", nullable = false)
    private SupportTicket ticket;

    // SENDER (User)
    @ManyToOne
    @JoinColumn(name = "SenderID", nullable = false)
    private User sender;

    @Column(name = "MessageContent", columnDefinition = "LONGTEXT")
    private String messageContent;

    @Column(name = "AttachmentUrl")
    private String attachmentUrl;

    @Column(name = "CreatedAt")
    private LocalDateTime createdAt;
}