package com.tallt.marketplace.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

/**
 * Entity Role (JPA) ánh xạ bảng Roles.
 *
 * TẠI SAO không dùng @Data cho Entity?
 * @Data sinh hashCode(), equals(), toString() bao gồm tất cả field. Với Entity có quan hệ (vd: User có Role),
 * toString() hoặc equals() có thể trigger Lazy Loading hoặc Infinite Recursion. @Getter và @Setter an toàn hơn.
 *
 * TẠI SAO bắt buộc có @NoArgsConstructor?
 * Hibernate/JPA cần constructor rỗng để tạo instance qua Reflection khi query từ DB.
 *
 * @FieldDefaults(level = AccessLevel.PRIVATE): Lombok tự động gán private cho mọi field, code gọn, không lặp "private".
 */
@Entity
@Table(name = "Roles")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Role {

    @Id
    @Column(name = "RoleID")
    Integer roleID; // 1: Admin, 2: Vendor, 3: Customer

    @Column(name = "RoleName")
    String roleName;
}
