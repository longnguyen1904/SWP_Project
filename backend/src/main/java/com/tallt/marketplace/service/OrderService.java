package com.tallt.marketplace.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.tallt.marketplace.dto.user.OrderWithDownloadDTO;
import com.tallt.marketplace.entity.Order;
import com.tallt.marketplace.entity.PlatformCommission;
import com.tallt.marketplace.entity.Product;
import com.tallt.marketplace.entity.User;
import com.tallt.marketplace.entity.Vendor;
import com.tallt.marketplace.entity.Wallet;
import com.tallt.marketplace.entity.WalletTransaction;
import com.tallt.marketplace.repository.OrderRepository;
import com.tallt.marketplace.repository.PlatformCommissionRepository;
import com.tallt.marketplace.repository.ProductRepository;
import com.tallt.marketplace.repository.WalletRepository;
import com.tallt.marketplace.repository.WalletTransactionRepository;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    // 🔥 Inject ProductRepository vào Service để lấy danh sách sản phẩm
    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private PlatformCommissionRepository commissionRepository;

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private WalletTransactionRepository walletTransactionRepository;

    public List<Order> getOrdersByUser(Integer userId) {
        return orderRepository.findByUser_UserID(userId);
    }

    public List<OrderWithDownloadDTO> getOrderDownloadLinks(Integer userId) {
        return orderRepository.findOrderDownloadLinks(userId);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    // =================================================================
    // 🔥 LOGIC API 1: Lấy danh sách đơn hàng cho Ticket
    // =================================================================
    public List<Map<String, Object>> getTicketProductsForUser(Integer userId) {
        List<Order> orders = orderRepository.findByUser_UserID(userId);
        List<Map<String, Object>> safeResponse = new ArrayList<>();

        for (Order o : orders) {
            String status = o.getPaymentStatus() != null ? o.getPaymentStatus().toUpperCase() : "PENDING";
            boolean isPurchased = status.equals("PAID") || status.equals("COMPLETED") || status.equals("SUCCESS");

            Map<String, Object> map = new HashMap<>();
            map.put("orderId", o.getOrderID());
            map.put("paymentStatus", status); 
            map.put("purchaseDate", o.getCreatedAt());
            map.put("isPurchased", isPurchased); 
            
            if (o.getProduct() != null) {
                map.put("productId", o.getProduct().getProductID());
                map.put("productName", o.getProduct().getProductName());
                map.put("productImage", o.getProduct().getGuideDocumentUrl());
                
                if (o.getProduct().getVendor() != null) {
                    map.put("vendorId", o.getProduct().getVendor().getVendorID());
                    map.put("vendorName", o.getProduct().getVendor().getCompanyName() != null 
                            ? o.getProduct().getVendor().getCompanyName() 
                            : "Shop #" + o.getProduct().getVendor().getVendorID());
                }
                if (o.getProduct().getCategory() != null) {
                    map.put("categoryName", o.getProduct().getCategory().getCategoryName());
                }
            }
            safeResponse.add(map);
        }
        return safeResponse;
    }

    // =================================================================
    // 🔥 LOGIC API 2: Lấy TẤT CẢ sản phẩm trên nền tảng (đã duyệt)
    // =================================================================
    public List<Map<String, Object>> getAllPlatformTicketProducts() {
        List<Product> products = productRepository.findAll();
        List<Map<String, Object>> safeResponse = new ArrayList<>();

        for (Product p : products) {
            if (p.getStatus() == Product.ProductStatus.APPROVED) {
                Map<String, Object> map = new HashMap<>();
                
                map.put("productId", p.getProductID());
                map.put("productName", p.getProductName());
                map.put("productImage", p.getGuideDocumentUrl());
                
                if (p.getVendor() != null) {
                    map.put("vendorId", p.getVendor().getVendorID());
                    map.put("vendorName", p.getVendor().getCompanyName() != null 
                            ? p.getVendor().getCompanyName() 
                            : "Shop #" + p.getVendor().getVendorID());
                }
                if (p.getCategory() != null) {
                    map.put("categoryName", p.getCategory().getCategoryName());
                }
                safeResponse.add(map);
            }
        }
        return safeResponse;
    }

    // --- LOGIC XỬ LÝ THANH TOÁN (Giữ nguyên) ---
    public void handleSuccessfulOrder(Order order) {
        PlatformCommission commission = commissionRepository.findTopByOrderByEffectiveFromDesc();
        BigDecimal percent = commission.getPercentage();
        BigDecimal total = order.getTotalAmount();
        BigDecimal commissionAmount = total.multiply(percent).divide(BigDecimal.valueOf(100));
        BigDecimal vendorRevenue = total.subtract(commissionAmount);

        Vendor vendor = order.getProduct().getVendor();
        User vendorUser = vendor.getUser();

        Wallet wallet = walletRepository.findByUser_UserID(vendorUser.getUserID()).orElse(null);
        if (wallet == null) return;

        wallet.setBalance(wallet.getBalance().add(vendorRevenue));
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);

        WalletTransaction transaction = new WalletTransaction();
        transaction.setWallet(wallet);
        transaction.setAmount(vendorRevenue);
        transaction.setType(WalletTransaction.TransactionType.SALE_REVENUE);
        transaction.setReferenceID(order.getOrderID());
        transaction.setDescription("Revenue from Order #" + order.getOrderID());
        walletTransactionRepository.save(transaction);
    }
}