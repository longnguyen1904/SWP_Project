package com.tallt.marketplace.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "Tags")
@Data
public class Tag {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "TagID")
    private Integer tagID;

    @Column(name = "TagName", unique = true, nullable = false)
    private String tagName;
}
