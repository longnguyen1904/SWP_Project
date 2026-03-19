package com.tallt.marketplace.repository;

import com.tallt.marketplace.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Integer> {

    List<Wishlist> findByUser_UserID(Integer userId);

    Optional<Wishlist> findByUser_UserIDAndProduct_ProductID(Integer userId, Integer productId);

    boolean existsByUser_UserIDAndProduct_ProductID(Integer userId, Integer productId);
}
