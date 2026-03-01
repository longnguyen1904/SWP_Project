package com.tallt.marketplace.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "Vendors")
@Data
public class Vendor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "VendorID")
    private Integer vendorID;

    @OneToOne
    @JoinColumn(name = "UserID", nullable = false, unique = true)
    private User user;

    @Column(name = "CompanyName")
    private String companyName;

    @Column(name = "IdentificationDoc")
    private String identificationDoc;

    @Enumerated(EnumType.STRING)
    @Column(name = "Status", nullable = false)
    private VendorStatus status = VendorStatus.PENDING;

    @Column(name = "VerifiedAt")
    private LocalDateTime verifiedAt;

    @Column(name = "CreatedAt", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(name = "Type", nullable = false)
    private VendorType type = VendorType.INDIVIDUAL;

    @Column(name = "TaxCode")
    private String taxCode;

    @Column(name = "CitizenID")
    private String citizenID;

    @Column(name = "RejectionNote")
    private String rejectionNote;

    public Boolean getIsVerified() {
        return this.status == VendorStatus.APPROVED;
    }

    public Boolean getIsActive() {
        return this.status == VendorStatus.APPROVED;
    }

    public enum VendorType {
        INDIVIDUAL, COMPANY
    }

    public enum VendorStatus {
        PENDING, APPROVED, REJECTED
    }
}