package com.tallt.marketplace.repository;

import com.tallt.marketplace.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    // Tìm kiếm bằng Email HOẶC Username
    User findByEmailOrUsername(String email, String username);

    // Kiểm tra trùng lặp khi đăng ký
    boolean existsByEmail(String email);

    boolean existsByUsername(String username);
}