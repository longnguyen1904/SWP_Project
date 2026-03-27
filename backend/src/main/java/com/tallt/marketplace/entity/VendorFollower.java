package com.tallt.marketplace.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "VendorFollowers", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"UserID", "VendorID"})
})
@Data
public class VendorFollower {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "FollowerID")
    private Integer followerId;

    @ManyToOne
    @JoinColumn(name = "UserID", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "VendorID", nullable = false)
    private Vendor vendor;

    @Column(name = "CreatedAt", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
