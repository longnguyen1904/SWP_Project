package com.tallt.marketplace.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtils {
    @Value("${jwt.secret:Thay_Bang_Mot_Chuoi_Rat_Dai_Va_Bi_Mat_Cua_Rieng_Ban}")
    private String jwtSecret;

    @Value("${jwt.expiration:86400000}") // 24 giờ
    private int jwtExpirationMs;

    public String generateToken(String email, String role) {
        Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
        return Jwts.builder()
                .setSubject(email)
                .claim("role", role) // Lưu Role vào Token để check nhanh
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }
}