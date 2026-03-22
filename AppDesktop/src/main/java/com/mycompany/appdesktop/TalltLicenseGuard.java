/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.mycompany.appdesktop;

import javax.swing.*;
import java.awt.*;
import java.net.URI;


/**
 *
 * @author long moi
 */
public class TalltLicenseGuard {
    private final String productId; // Mã sản phẩm được TALLT cấp
    private String verifiedLicenseKey = null;
    // Đổi thành URL deploy thực tế của TALLT Market
    private final String MARKET_API_URL = "https://twelve-lands-nail.loca.lt/api/v1/licenses/verify";

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
                        this.verifiedLicenseKey = licenseKey;
                        startHeartbeat(); // Bắt đầu vòng lấp Heartbeat 15s/lần
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

    private String cachedDeviceId = null;

    private String getDeviceIdentifier() {
        if (cachedDeviceId == null) {
            try {
                String osUser = System.getProperty("user.name");
                String hostName = java.net.InetAddress.getLocalHost().getHostName();
                // Giả lập ID máy tính ngẫu nhiên mỗi lần bật App để test
                cachedDeviceId = osUser + "@" + hostName + "_TEST_" + new java.util.Random().nextInt(10000);
            } catch (Exception e) {
                cachedDeviceId = "UNKNOWN_DEVICE_" + System.currentTimeMillis();
            }
        }
        return cachedDeviceId;
    }

    private String getDeviceName() {
        try {
            return java.net.InetAddress.getLocalHost().getHostName();
        } catch (Exception e) {
            return "Unknown PC";
        }
    }

    private boolean verifyWithMarket(String licenseKey) {
        try {
            String deviceId = getDeviceIdentifier();
            String deviceName = getDeviceName();
            String jsonPayload = String.format("{\"licenseKey\":\"%s\", \"productId\":\"%s\", \"deviceId\":\"%s\", \"deviceName\":\"%s\"}", 
                    licenseKey, this.productId, deviceId, deviceName);
            
            java.net.URL url = new java.net.URL(MARKET_API_URL);
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Bypass-Tunnel-Reminder", "true");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);
            conn.setDoOutput(true);
            
            try (java.io.OutputStream os = conn.getOutputStream()) {
                byte[] input = jsonPayload.getBytes("utf-8");
                os.write(input, 0, input.length);
            }
            
            return conn.getResponseCode() == 200; 
        } catch (Exception ex) {
            ex.printStackTrace();
            return false;
        }
    }

    public void releaseSession() {
        if (this.verifiedLicenseKey == null) return;
        try {
            String deviceId = getDeviceIdentifier();
            String jsonPayload = String.format("{\"licenseKey\":\"%s\", \"deviceId\":\"%s\"}", 
                    this.verifiedLicenseKey, deviceId);
            
            String releaseUrl = MARKET_API_URL.replace("/verify", "/release");
            java.net.URL url = new java.net.URL(releaseUrl);
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Bypass-Tunnel-Reminder", "true");
            conn.setConnectTimeout(3000);
            conn.setReadTimeout(3000);
            conn.setDoOutput(true);
            
            try (java.io.OutputStream os = conn.getOutputStream()) {
                byte[] input = jsonPayload.getBytes("utf-8");
                os.write(input, 0, input.length);
            }
            conn.getResponseCode(); // Gửi Request
        } catch (Exception ex) {
            // Im lặng bỏ qua
        }
    }

    private void startHeartbeat() {
        if (this.verifiedLicenseKey == null) return;
        Timer timer = new Timer(15000, e -> {
            try {
                String deviceId = getDeviceIdentifier();
                String jsonPayload = String.format("{\"licenseKey\":\"%s\", \"deviceId\":\"%s\"}", 
                        this.verifiedLicenseKey, deviceId);
                
                String heartbeatUrl = MARKET_API_URL.replace("/verify", "/heartbeat");
                java.net.URL url = new java.net.URL(heartbeatUrl);
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setRequestProperty("Bypass-Tunnel-Reminder", "true");
                conn.setConnectTimeout(3000);
                conn.setReadTimeout(3000);
                conn.setDoOutput(true);
                
                try (java.io.OutputStream os = conn.getOutputStream()) {
                    byte[] input = jsonPayload.getBytes("utf-8");
                    os.write(input, 0, input.length);
                }
                
                if (conn.getResponseCode() == 403) {
                    ((Timer)e.getSource()).stop();
                    JOptionPane.showMessageDialog(null, "Tài khoản của bạn đã đăng nhập ở thiết bị khác!\nỨng dụng sẽ tự động đóng.", "Cảnh báo bảo mật", JOptionPane.ERROR_MESSAGE);
                    System.exit(0);
                }
            } catch (Exception ex) {
                // Bỏ qua lỗi mạng chập chờn
            }
        });
        timer.start();
    }
}
