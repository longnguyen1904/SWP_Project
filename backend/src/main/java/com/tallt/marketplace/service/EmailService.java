package com.tallt.marketplace.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public void sendEmail(String to, String subject, String body) {
        if (to == null || to.isBlank() || mailSender == null) {
            System.out.println("[EmailService] Mail sender not configured, skipping email to: " + to);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            if (fromEmail != null && !fromEmail.isBlank()) {
                message.setFrom(fromEmail);
            }
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            System.out.println("[EmailService] Email sent successfully to: " + to);
        } catch (Exception e) {
            System.err.println("[EmailService] Failed to send email to " + to + ": " + e.getMessage());
            // Don't rethrow - let the caller continue even if email fails
        }
    }
}
