package com.tallt.marketplace.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tallt.marketplace.entity.User;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    
    User findByEmail(String email);

    boolean existsByEmail(String email);
}