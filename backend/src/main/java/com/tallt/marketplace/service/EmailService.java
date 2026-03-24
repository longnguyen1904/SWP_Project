package com.tallt.marketplace.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    private static final String BRAND = "TALLT Marketplace";

    /**
     * Gửi email HTML với template thống nhất.
     *
     * @param to      email người nhận
     * @param subject tiêu đề
     * @param title   heading lớn trong email (VD: "Password Reset", "New Update")
     * @param body    nội dung HTML (cho phép tag <p>, <strong>, <br>, <a>...)
     */
    public void sendEmail(String to, String subject, String title, String body) {
        if (to == null || to.isBlank() || mailSender == null) {
            System.out.println("[EmailService] Mail sender not configured, skipping email to: " + to);
            return;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            if (fromEmail != null && !fromEmail.isBlank()) {
                helper.setFrom(fromEmail);
            }
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(buildHtmlTemplate(title, body), true);
            mailSender.send(mimeMessage);
            System.out.println("[EmailService] Email sent successfully to: " + to);
        } catch (MessagingException e) {
            System.err.println("[EmailService] Failed to send email to " + to + ": " + e.getMessage());
        }
    }

    /**
     * Template HTML chung cho mọi email của hệ thống.
     */
    private String buildHtmlTemplate(String title, String bodyContent) {
        return "<!DOCTYPE html>"
                + "<html><head><meta charset='UTF-8'></head>"
                + "<body style='margin:0;padding:0;background-color:#0f1117;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;'>"
                + "<table width='100%' cellpadding='0' cellspacing='0' style='background-color:#0f1117;padding:40px 0;'>"
                + "<tr><td align='center'>"
                + "<table width='600' cellpadding='0' cellspacing='0' style='background-color:#1a1d27;border-radius:12px;overflow:hidden;'>"

                // Header
                + "<tr><td style='background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:32px 40px;text-align:center;'>"
                + "<h1 style='margin:0;color:#ffffff;font-size:24px;font-weight:700;'>" + BRAND + "</h1>"
                + "</td></tr>"

                // Title
                + "<tr><td style='padding:32px 40px 16px;'>"
                + "<h2 style='margin:0;color:#e2e8f0;font-size:20px;font-weight:600;'>" + escapeHtml(title) + "</h2>"
                + "</td></tr>"

                // Body
                + "<tr><td style='padding:0 40px 32px;color:#a0aec0;font-size:15px;line-height:1.7;'>"
                + bodyContent
                + "</td></tr>"

                // Footer
                + "<tr><td style='padding:24px 40px;border-top:1px solid #2d3748;text-align:center;'>"
                + "<p style='margin:0;color:#4a5568;font-size:12px;'>"
                + "© 2026 " + BRAND + ". All rights reserved."
                + "</p></td></tr>"

                + "</table></td></tr></table></body></html>";
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
