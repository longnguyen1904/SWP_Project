package com.tallt.marketplace.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "ProductVersions")
@Data
public class ProductVersion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "VersionID")
    private Integer versionID;

    @ManyToOne
    @JoinColumn(name = "ProductID", nullable = false)
    private Product product;

    @Column(name = "VersionNumber")
    private String versionNumber;

    @Column(name = "FileUrl", nullable = false)
    private String fileUrl;

    @Column(name = "ReleaseNotes", columnDefinition = "LONGTEXT")
    private String releaseNotes;

    @Column(name = "CreatedAt", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
