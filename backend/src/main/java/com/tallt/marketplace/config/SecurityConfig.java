package com.tallt.marketplace.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

/**
 * Cấu hình Spring Security: CORS, API public, JWT Resource Server, 401 trả ApiResponse.
 *
 * TẠI SAO phải cấu hình CORS ngay trong Security Filter Chain?
 * Security Filter chạy trước Web MVC. Khi Frontend (localhost:5173) gửi request đến Backend (8081), trình duyệt
 * có thể gửi Preflight (OPTIONS) trước. Nếu CORS chỉ cấu hình ở WebMvcConfigurer, request OPTIONS có thể đã bị
 * Security chặn (401) trước khi tới bước add CORS header. Đưa CORS vào Security đảm bảo Preflight và request thật
 * đều được gắn header CORS và cho phép đi qua đúng quy tắc.
 */
@Configuration
public class SecurityConfig {

    /** Các API cho phép khách vãng lai gọi không cần đăng nhập: Đăng ký (POST /users), Đăng nhập (POST /auth/token), Kiểm tra Token (POST /auth/introspect). */
    private static final String[] PUBLIC_ENDPOINTS = {
            "/api/users",
            "/api/auth/token",
            "/api/auth/introspect"
    };

    @Value("${jwt.signerKey}")
    private String signerKey;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Cấu hình CORS: cho phép Frontend (Vite mặc định port 5173) gọi API, gửi credential (cookie/Authorization).
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * Trái tim của Spring Security: quy định endpoint nào public, endpoint nào bắt buộc có JWT.
     * CORS được áp dụng trong filter chain để Preflight (OPTIONS) và request thật đều có header CORS.
     * TẠI SAO tắt CSRF? RESTful API dùng JWT trong Header, không lưu session trên server, nên không bị tấn công CSRF.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST, PUBLIC_ENDPOINTS).permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .authenticationEntryPoint(new JwtAuthenticationEntryPoint())
                        .jwt(jwt -> jwt
                                .decoder(jwtDecoder())
                                .jwtAuthenticationConverter(jwtAuthenticationConverter())
                        )
                );
        return http.build();
    }

    /**
     * Bộ giải mã JWT (HS512). Spring Security dùng Bean này để: lấy Token từ Header "Authorization: Bearer <token>",
     * giải mã và kiểm tra chữ ký bằng signerKey (xem token có bị giả mạo không), kiểm tra thời hạn (exp).
     * Nếu hợp lệ thì request được coi là đã xác thực; nếu không thì gọi JwtAuthenticationEntryPoint (trả 401 + body ApiResponse).
     */
    @Bean
    public JwtDecoder jwtDecoder() {
        SecretKeySpec secretKeySpec = new SecretKeySpec(
                signerKey.getBytes(StandardCharsets.UTF_8),
                "HmacSHA512"
        );
        return NimbusJwtDecoder.withSecretKey(secretKeySpec)
                .macAlgorithm(MacAlgorithm.HS512)
                .build();
    }

    /**
     * Chuyển đổi claims trong JWT thành GrantedAuthority (phục vụ phân quyền @PreAuthorize sau này).
     * Mặc định Spring Security đọc claim "scope" và tự thêm tiền tố "SCOPE_" (thành SCOPE_ROLE_Customer), gây rườm rà.
     * Ở đây set authorityPrefix("") để giữ nguyên tên đã đặt lúc tạo Token (ROLE_Customer, ROLE_Admin).
     */
    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
        grantedAuthoritiesConverter.setAuthorityPrefix("");

        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
        return jwtAuthenticationConverter;
    }
}
