package com.tallt.marketplace.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;


@Entity
@Table(name = "ProductVersions")
@Getter
@Setter
public class ProductVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "VersionID")
    private Integer versionID;

    @Column(name = "ProductID", nullable = false)
    private Integer productID;

    @Column(name = "ScanStatus")
    private String scanStatus = "PENDING";

    @Column(name = "VersionNumber")
    private String versionNumber;

    @Column(name = "FileUrl", nullable = false)
    private String fileUrl;

    @Lob
    @Column(name = "ReleaseNotes")
    private String releaseNotes;

    @Column(name = "CreatedAt", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "ProductID", insertable = false, updatable = false)
    private Product product;
}