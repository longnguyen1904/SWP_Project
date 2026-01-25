package com.tallt.marketplace.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * Spring Security 6 / Spring Boot 3 standard configuration.
     *
     * - Enables CORS for React frontend (http://localhost:5173)
     * - Disables CSRF (stateless API)
     * - Permits public access to /api/auth/** for login/register
     * - Requires authentication for all other endpoints (ready for JWT later)
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Allow CORS preflight requests
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Public authentication endpoints (login/register)
                        .requestMatchers(new AntPathRequestMatcher("/api/auth/**")).permitAll()
                        // Everything else is protected (JWT can be added later)
                        .anyRequest().authenticated()
                )
                // Disable default form login for REST APIs
                .httpBasic(basic -> basic.disable())
                .formLogin(form -> form.disable())
                /*
                 * JWT placeholder:
                 * Add your JWT filter later, e.g.
                 * .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                 */
                .build();
    }

    /**
     * CORS configuration for Spring Security filter chain.
     * Note: WebMvcConfigurer CORS alone is NOT enough when Spring Security is enabled.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}

