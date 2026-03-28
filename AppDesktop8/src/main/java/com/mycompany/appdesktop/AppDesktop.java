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
        // Khá»Ÿi táº¡o SDK báº£o vá»‡ vá»›i ID sáº£n pháº©m lÃ  8
        TalltLicenseGuard guard = new TalltLicenseGuard("8");

        // Báº¯t buá»™c nháº­p License thÃ nh cÃ´ng thÃ¬ má»›i cháº¡y hÃ m bÃªn trong
        guard.requireLicenseToLaunch(() -> {
            // Äáº·t code khá»Ÿi cháº¡y UI chÃ­nh cá»§a Vendor á»Ÿ Ä‘Ã¢y
            System.out.println("Äang má»Ÿ pháº§n má»m chÃ­nh...");

            // Táº¡o má»™t cá»­a sá»• giáº£ láº­p Ä‘á»ƒ app khÃ´ng bá»‹ táº¯t ngay láº­p tá»©c
            javax.swing.JFrame frame = new javax.swing.JFrame("Main Vendor App 8");
            frame.setSize(400, 300);

            frame.setDefaultCloseOperation(javax.swing.JFrame.DO_NOTHING_ON_CLOSE);
            frame.addWindowListener(new java.awt.event.WindowAdapter() {
                @Override
                public void windowClosing(java.awt.event.WindowEvent e) {
                    System.out.println("Äang nháº£ License...");
                    guard.releaseSession();
                    System.exit(0);
                }
            });
            frame.setLocationRelativeTo(null);
            javax.swing.JLabel label = new javax.swing.JLabel("Pháº§n má»m chÃ­nh 8 Ä‘ang hoáº¡t Ä‘á»™ng...",
                    javax.swing.JLabel.CENTER);
            label.setFont(new java.awt.Font("Arial", java.awt.Font.BOLD, 16));
            frame.add(label);
            frame.setVisible(true);
        });
    }
}