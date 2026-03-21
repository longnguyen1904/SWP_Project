package com.tallt.marketplace.repository;

import com.tallt.marketplace.entity.WalletTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Integer> {

    List<WalletTransaction> findByWallet_WalletIDOrderByCreatedAtDesc(Integer walletId);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM WalletTransaction t WHERE t.wallet.walletID = :walletId AND t.type = :type")
    BigDecimal sumAmountByWalletAndType(@Param("walletId") Integer walletId, @Param("type") WalletTransaction.TransactionType type);
}
