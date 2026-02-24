package com.tallt.marketplace.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "ProductVersions")
@Getter
@Setter
public class ProductVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer versionID;

    private String versionNumber;

    private String fileUrl;

    @Lob
    private String releaseNotes;

    @Column(name = "CreatedAt")
    private LocalDateTime createdAt;

    @Column(name = "ScanStatus")
    private String scanStatus; // PENDING / CLEAN / MALICIOUS

    @ManyToOne
    @JoinColumn(name = "ProductID")
    @JsonIgnore
    private Product product;
}