package com.tallt.marketplace.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tallt.marketplace.entity.SupportTicket;

@Repository
public interface SupportTicketRepository 
        extends JpaRepository<SupportTicket, Integer> {
}