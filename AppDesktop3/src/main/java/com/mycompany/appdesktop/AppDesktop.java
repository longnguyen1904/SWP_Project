/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 */
package com.mycompany.appdesktop;

/**
 *
 * @author long moi
 */
public class AppDesktop {
    public static void main(String[] args) {
        // Khởi tạo SDK bảo vệ với ID sản phẩm là 03
        TalltLicenseGuard guard = new TalltLicenseGuard("3");

        // Bắt buộc nhập License thành công thì mới chạy hàm bên trong
        guard.requireLicenseToLaunch(() -> {
            // Đặt code khởi chạy UI chính của Vendor ở đây
            System.out.println("Đang mở phần mềm chính...");

            // Tạo một cửa sổ giả lập để app không bị tắt ngay lập tức
            javax.swing.JFrame frame = new javax.swing.JFrame("Main Vendor App 3");
            frame.setSize(400, 300);

            frame.setDefaultCloseOperation(javax.swing.JFrame.DO_NOTHING_ON_CLOSE);
            frame.addWindowListener(new java.awt.event.WindowAdapter() {
                @Override
                public void windowClosing(java.awt.event.WindowEvent e) {
                    System.out.println("Đang nhả License...");
                    guard.releaseSession();
                    System.exit(0);
                }
            });
            frame.setLocationRelativeTo(null);
            javax.swing.JLabel label = new javax.swing.JLabel("Phần mềm chính 3 đang hoạt động...",
                    javax.swing.JLabel.CENTER);
            label.setFont(new java.awt.Font("Arial", java.awt.Font.BOLD, 16));
            frame.add(label);
            frame.setVisible(true);
        });
    }
}
