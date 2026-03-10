package com.tallt.marketplace.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.tallt.marketplace.entity.Order;
import com.tallt.marketplace.entity.PlatformCommission;
import com.tallt.marketplace.entity.User;
import com.tallt.marketplace.entity.Vendor;
import com.tallt.marketplace.entity.Wallet;
import com.tallt.marketplace.entity.WalletTransaction;
import com.tallt.marketplace.repository.OrderRepository;
import com.tallt.marketplace.repository.PlatformCommissionRepository;
import com.tallt.marketplace.repository.WalletRepository;
import com.tallt.marketplace.repository.WalletTransactionRepository;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PlatformCommissionRepository commissionRepository;

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private WalletTransactionRepository walletTransactionRepository;


    public List<Order> getOrdersByUser(Integer userId) {
        return orderRepository.findByUser_UserID(userId);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }


     public void handleSuccessfulOrder(Order order) {

        PlatformCommission commission =
                commissionRepository.findTopByOrderByEffectiveFromDesc();

        BigDecimal percent = commission.getPercentage();

        BigDecimal total = order.getTotalAmount();

        BigDecimal commissionAmount =
                total.multiply(percent)
                     .divide(BigDecimal.valueOf(100));

        BigDecimal vendorRevenue =
                total.subtract(commissionAmount);

        Vendor vendor = order.getProduct().getVendor();
        User vendorUser = vendor.getUser();

        Wallet wallet =
                walletRepository
                        .findByUser_UserID(vendorUser.getUserID())
                        .orElse(null);

        if (wallet == null) return;

        wallet.setBalance(
                wallet.getBalance().add(vendorRevenue));

        wallet.setUpdatedAt(LocalDateTime.now());

        walletRepository.save(wallet);

        WalletTransaction transaction =
                new WalletTransaction();

        transaction.setWallet(wallet);
        transaction.setAmount(vendorRevenue);
        transaction.setType(
                WalletTransaction.TransactionType.SALE_REVENUE);
        transaction.setReferenceID(order.getOrderID());
        transaction.setDescription(
                "Revenue from Order #" + order.getOrderID());

        walletTransactionRepository.save(transaction);
    }
}