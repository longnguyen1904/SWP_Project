package com.tallt.marketplace.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;


@Repository
public class RevenueRepository {

    @PersistenceContext
    private EntityManager entityManager;

    // 📈 Doanh thu theo ngày
    public List<Object[]> getDailyRevenue(
            int vendorId,
            LocalDateTime from,
            LocalDateTime to) {

        String sql = """
            SELECT DATE(wt.CreatedAt), SUM(wt.Amount)
            FROM WalletTransactions wt
            JOIN Wallets w ON wt.WalletID = w.WalletID
            JOIN Vendors v ON w.UserID = v.UserID
            WHERE v.VendorID = :vendorId
              AND wt.Type = 'SALE_REVENUE'
              AND wt.CreatedAt BETWEEN :from AND :to
            GROUP BY DATE(wt.CreatedAt)
            ORDER BY DATE(wt.CreatedAt)
        """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("vendorId", vendorId);
        query.setParameter("from", from);
        query.setParameter("to", to);

        return query.getResultList();
    }

    // 📊 Tổng doanh thu + số đơn
    public Object[] getSummary(
            int vendorId,
            LocalDateTime from,
            LocalDateTime to) {

        String sql = """
            SELECT COALESCE(SUM(wt.Amount), 0), COUNT(wt.TransactionID)
            FROM WalletTransactions wt
            JOIN Wallets w ON wt.WalletID = w.WalletID
            JOIN Vendors v ON w.UserID = v.UserID
            WHERE v.VendorID = :vendorId
              AND wt.Type = 'SALE_REVENUE'
              AND wt.CreatedAt BETWEEN :from AND :to
        """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("vendorId", vendorId);
        query.setParameter("from", from);
        query.setParameter("to", to);

        return (Object[]) query.getSingleResult();
    }
}

