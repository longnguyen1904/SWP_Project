package com.tallt.marketplace.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtils {
    // Chìa khóa bí mật để ký tên vào Token. Hãy giữ kín nó!
    private final String SECRET_KEY = "Lam_Software_Marketplace_Secret_Key_Vip_2026";
    private final Key key = Keys.hmacShaKeyFor(SECRET_KEY.getBytes());

    // Thời gian sống của Token: 24h (86.400.000 ms)
    private final long EXPIRATION_TIME = 86400000;

    // Tạo token từ Email (hoặc Username)
    public String generateToken(String identifier, String role) {
        return Jwts.builder()
                .setSubject(identifier)
                .claim("role", role) // Lưu Role để phân quyền US16, US19
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // Giải mã và lấy thông tin từ Token
    public String getIdentifierFromToken(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build()
                .parseClaimsJws(token).getBody().getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}