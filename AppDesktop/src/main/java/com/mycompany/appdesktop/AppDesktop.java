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
        // Khởi tạo SDK bảo vệ với ID sản phẩm là 05
        TalltLicenseGuard guard = new TalltLicenseGuard("81");

        // Bắt buộc nhập License thành công thì mới chạy hàm bên trong
        guard.requireLicenseToLaunch(() -> {
            // Đặt code khởi chạy UI chính của Vendor ở đây
            System.out.println("Đang mở phần mềm chính...");
            // Ví dụ: new MainFrame().setVisible(true);
        });
    }
}
