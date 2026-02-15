package com.tallt.marketplace.repository;

import com.tallt.marketplace.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    // Spring JPA sẽ tự hiểu logic: WHERE Email = ? OR Username = ?
    User findByEmailOrUsername(String email, String username);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username); // Nhớ thêm hàm này để dùng khi Register
}