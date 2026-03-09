package com.tallt.marketplace.repository;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tallt.marketplace.entity.TicketMessage;

@Repository
public interface TicketMessageRepository 
        extends JpaRepository<TicketMessage, Integer> {
            List<TicketMessage> findByTicketTicketId(Integer ticketId);
}