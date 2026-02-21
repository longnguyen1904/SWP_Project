package com.tallt.marketplace.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tallt.marketplace.dto.request.ApiResponse;
import com.tallt.marketplace.exception.ErrorCode;

import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

/**
 * Xử lý khi request chưa xác thực (không có token hoặc token sai/hết hạn): trả 401 với body JSON đúng format ApiResponse.
 * TẠI SAO không để Spring trả body mặc định? Mặc định 401 thường trả body trống hoặc HTML, client (React) khó parse.
 * Trả về đúng format { code, message, result } giúp Frontend nhất quán: if (code !== 1000) thì hiển thị message.
 */
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        ApiResponse<Object> apiResponse = ApiResponse.fail(
                ErrorCode.UNAUTHENTICATED.getCode(),
                ErrorCode.UNAUTHENTICATED.getMessage()
        );

        response.getWriter().write(objectMapper.writeValueAsString(apiResponse));
    }
}
