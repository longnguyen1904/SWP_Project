package com.tallt.marketplace.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

/**
 * Entity User (JPA) ánh xạ bảng Users.
 *
 * TẠI SAO không dùng @Data cho Entity?
 * @Data tự động sinh hashCode(), equals() và toString() bao gồm tất cả field. Khi Entity có quan hệ
 * Lazy Loading (vd: @OneToMany), gọi toString() có thể vô tình trigger query DB hoặc gây vòng lặp
 * vô tận (Infinite Recursion). Dùng @Getter và @Setter là an toàn nhất cho JPA Entity.
 *
 * TẠI SAO bắt buộc có @NoArgsConstructor?
 * Hibernate/JPA cần constructor rỗng để tạo object qua Reflection khi load dữ liệu từ DB lên.
 *
 * TẠI SAO phải dùng @Builder.Default cho field có giá trị mặc định?
 * Khi dùng @Builder, Lombok sẽ bỏ qua giá trị gán sẵn lúc khai báo field nếu không có annotation này,
 * dẫn đến isActive/createdAt bị null khi build. @Builder.Default bảo Lombok giữ giá trị mặc định khi
 * builder không set field đó.
 */
@Entity
@Table(name = "Users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "UserID")
    Integer userID;

    @Column(name = "Email", unique = true, nullable = false)
    String email;

    @Column(name = "Username", unique = true, nullable = false)
    String username;

    @Column(name = "PasswordHash", nullable = false)
    String passwordHash;

    @Column(name = "FullName")
    String fullName;

    @ManyToOne
    @JoinColumn(name = "RoleID", nullable = false)
    Role role;

    @Column(name = "IsActive")
    @Builder.Default
    Boolean isActive = true;

    @Column(name = "CreatedAt", updatable = false)
    @Builder.Default
    LocalDateTime createdAt = LocalDateTime.now();
}
