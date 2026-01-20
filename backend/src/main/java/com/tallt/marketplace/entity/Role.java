package com.tallt.marketplace.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "Roles")
@Data
public class Role {
    @Id
    @Column(name = "RoleID")
    private Integer roleID; // 1: Admin, 2: Vendor, 3: Customer

    @Column(name = "RoleName")
    private String roleName;
}