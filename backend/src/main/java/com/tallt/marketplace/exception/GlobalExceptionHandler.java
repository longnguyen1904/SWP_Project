package com.tallt.marketplace.exception;

import com.tallt.marketplace.constant.MessageConstant;
import com.tallt.marketplace.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Hứng lỗi Logic (Email trùng, Role lỗi...)
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Object>> handleAppException(AppException e) {
        return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
    }

    // Hứng lỗi Validation (@Valid, @NotBlank, @NotNull...)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationException(
            MethodArgumentNotValidException e) {
        Map<String, String> errors = new HashMap<>();
        e.getBindingResult().getFieldErrors().forEach(error ->
                errors.put(error.getField(), error.getDefaultMessage())
        );
        ApiResponse<Map<String, String>> response = new ApiResponse<>(
                false, MessageConstant.VALIDATION_FAILED, errors
        );
        return ResponseEntity.badRequest().body(response);
    }

    // Hứng lỗi thiếu Header (X-User-Id)
    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<ApiResponse<Object>> handleMissingHeader(MissingRequestHeaderException e) {
        return ResponseEntity.badRequest().body(
                ApiResponse.error("Thiếu header bắt buộc: " + e.getHeaderName())
        );
    }

    // Hứng lỗi hệ thống (Bug, DB sập...)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleUnwantedException(Exception e) {
        e.printStackTrace(); // In lỗi ra console để debug
        return ResponseEntity.status(500).body(ApiResponse.error(MessageConstant.SYSTEM_ERROR));
    }
}