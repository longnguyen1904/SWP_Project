package com.tallt.marketplace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Standardized API Response wrapper for all endpoints.
 * Ensures consistent response structure across the application.
 * 
 * Structure designed for easy React integration:
 * - code: Internal error code (for React to identify specific errors)
 * - message: Human-readable message
 * - result: Data payload (can be null for errors)
 * - timestamp: Response generation time
 * 
 * @param <T> The type of data in the result field
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    /**
     * Internal error code (from ErrorCode enum)
     * React can use this code to show specific error messages or handle errors differently
     */
    private int code;
    
    /**
     * Human-readable message describing the result
     */
    private String message;
    
    /**
     * The actual data payload (can be null for errors)
     * For validation errors, this will be a Map<String, String> with field errors
     */
    private T result;
    
    /**
     * Timestamp when the response was generated
     */
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
    
    /**
     * Static factory method for success responses
     */
    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .code(2000) // ErrorCode.SUCCESS.code
                .message("Thành công")
                .result(data)
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    /**
     * Static factory method for success responses with custom message
     */
    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .code(2000) // ErrorCode.SUCCESS.code
                .message(message)
                .result(data)
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    /**
     * Static factory method for error responses using ErrorCode
     */
    public static <T> ApiResponse<T> error(com.tallt.marketplace.exception.ErrorCode errorCode) {
        return ApiResponse.<T>builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .result(null)
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    /**
     * Static factory method for error responses with custom code and message
     */
    public static <T> ApiResponse<T> error(int code, String message) {
        return ApiResponse.<T>builder()
                .code(code)
                .message(message)
                .result(null)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
