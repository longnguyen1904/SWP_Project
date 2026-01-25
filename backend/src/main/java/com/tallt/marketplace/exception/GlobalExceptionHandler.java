package com.tallt.marketplace.exception;

import com.tallt.marketplace.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler for all controllers.
 * Ensures all responses follow the ApiResponse<T> structure.
 * 
 * This handler is crucial for React integration:
 * - All errors are returned in ApiResponse format
 * - Validation errors are extracted and returned as Map<String, String>
 * - React can use the 'code' field to identify specific errors and show appropriate UI
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handles custom business logic exceptions (AppException).
     * Returns standardized ApiResponse with ErrorCode.
     * 
     * React can check the 'code' field to show specific error messages or handle errors differently.
     * Example: if (response.code === 1001) { showEmailError(); }
     */
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Object>> handleAppException(AppException e) {
        ErrorCode errorCode = e.getErrorCode();
        log.warn("Business exception: {} (code: {}) - {}", 
                errorCode.name(), errorCode.getCode(), e.getMessage());
        
        ApiResponse<Object> response = ApiResponse.error(errorCode);
        
        return ResponseEntity
                .status(errorCode.getHttpStatus())
                .body(response);
    }

    /**
     * Handles validation errors from @Valid annotations.
     * 
     * This is critical for React forms:
     * - Extracts field-level errors (email, password, username, etc.)
     * - Returns errors as Map<String, String> in the 'result' field
     * - React can use this to show red error messages under each input field
     * 
     * Example response:
     * {
     *   "code": 2001,
     *   "message": "Dữ liệu không hợp lệ",
     *   "result": {
     *     "email": "Email không đúng định dạng",
     *     "password": "Password phải có ít nhất 6 ký tự"
     *   }
     * }
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationException(
            MethodArgumentNotValidException e) {
        
        Map<String, String> errors = new HashMap<>();
        e.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        log.warn("Validation error: {}", errors);
        
        ApiResponse<Map<String, String>> response = ApiResponse.error(ErrorCode.VALIDATION_ERROR);
        response.setResult(errors); // Set field errors in result for React to display
        
        return ResponseEntity
                .status(ErrorCode.VALIDATION_ERROR.getHttpStatus())
                .body(response);
    }

    /**
     * Handles all other unexpected exceptions.
     * Logs the full stack trace for debugging and returns a generic error response.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleUnwantedException(Exception e) {
        log.error("Unexpected exception occurred", e);
        
        ApiResponse<Object> response = ApiResponse.error(ErrorCode.INTERNAL_SERVER_ERROR);
        
        return ResponseEntity
                .status(ErrorCode.INTERNAL_SERVER_ERROR.getHttpStatus())
                .body(response);
    }
}
