package com.tallt.marketplace.repository;

import com.tallt.marketplace.entity.WalletTransaction;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Integer> {

    Page<WalletTransaction> findByWallet_WalletID(
            Integer walletId,
            Pageable pageable);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM WalletTransaction t WHERE t.wallet.walletID = :walletId AND t.type = :type")
    BigDecimal sumAmountByWalletAndType(@Param("walletId") Integer walletId,
            @Param("type") WalletTransaction.TransactionType type);

    Page<WalletTransaction> findByWallet_WalletIDAndCreatedAtBetween(
            Integer walletId,
            LocalDateTime from,
            LocalDateTime to,
            Pageable pageable);
}
