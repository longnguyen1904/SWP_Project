package com.tallt.marketplace.repository;

import com.tallt.marketplace.entity.WalletTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Integer> {

    List<WalletTransaction> findByWallet_WalletIDOrderByCreatedAtDesc(Integer walletId);
}
