/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.mycompany.appdesktop;

import javax.swing.*;
import java.awt.*;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 *
 * @author long moi
 */
public class TalltLicenseGuard {
    private final String productId; // Mã sản phẩm được TALLT cấp
    // Đổi thành URL deploy thực tế của TALLT Market
    private final String MARKET_API_URL = "http://localhost:8081/api/v1/licenses/verify";

    public TalltLicenseGuard(String productId) {
        // Đảm bảo productId luôn có 2 ký tự
        this.productId = productId.length() == 1 ? "0" + productId : productId;
    }

    // Hàm vendor gọi để yêu cầu nhập Key trước khi vào App
    public void requireLicenseToLaunch(Runnable onSuccessLaunch) {
        JFrame frame = new JFrame("Kích hoạt bản quyền sản phẩm");
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.setSize(450, 200);
        frame.setLocationRelativeTo(null);
        frame.setLayout(new FlowLayout(FlowLayout.CENTER, 10, 20));

        JLabel label = new JLabel("Vui lòng nhập License Key từ TALLT Market:");
        JTextField keyField = new JTextField(25);
        JButton submitBtn = new JButton("Xác thực");

        submitBtn.addActionListener(e -> {
            String licenseKey = keyField.getText().trim();

            // 1. CHECK OFFLINE: Tách 2 ký tự đầu xem có đúng mã sản phẩm không
            if (licenseKey.length() < 2 || !licenseKey.substring(0, 2).equals(this.productId)) {
                JOptionPane.showMessageDialog(frame, 
                    "License Key sai định dạng hoặc không dành cho ứng dụng này!\n(Mã ứng dụng: " + this.productId + ")", 
                    "Lỗi xác thực", 
                    JOptionPane.ERROR_MESSAGE);
                return;
            }

            // 2. CHECK ONLINE: Gửi về Database của Market
            submitBtn.setEnabled(false);
            submitBtn.setText("Đang kiểm tra DB...");

            new Thread(() -> {
                boolean isValid = verifyWithMarket(licenseKey);
                SwingUtilities.invokeLater(() -> {
                    if (isValid) {
                        JOptionPane.showMessageDialog(frame, "Kích hoạt thành công! Cảm ơn bạn.");
                        frame.dispose(); // Tắt form nhập key
                        onSuccessLaunch.run(); // Chạy App của Vendor
                    } else {
                        JOptionPane.showMessageDialog(frame, "Key không tồn tại trên hệ thống hoặc đã được sử dụng.", "Lỗi hệ thống", JOptionPane.ERROR_MESSAGE);
                        submitBtn.setEnabled(true);
                        submitBtn.setText("Xác thực");
                    }
                });
            }).start();
        });

        frame.add(label);
        frame.add(keyField);
        frame.add(submitBtn);
        frame.setVisible(true);
    }

    private boolean verifyWithMarket(String licenseKey) {
        try {
            String jsonPayload = String.format("{\"licenseKey\":\"%s\", \"productId\":\"%s\"}", licenseKey, this.productId);
            
            HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(productId).create(MARKET_API_URL))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200; 
        } catch (Exception ex) {
            ex.printStackTrace();
            return false;
        }
    }
}
