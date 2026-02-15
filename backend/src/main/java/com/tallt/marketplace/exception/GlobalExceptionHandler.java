package com.tallt.marketplace.exception;

import com.tallt.marketplace.constant.MessageConstant;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.validation.FieldError;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. Hứng lỗi Validation (khi thiếu @Valid hoặc sai định dạng)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<String> handleValidationException(MethodArgumentNotValidException e) {
        // Lấy ra lỗi đầu tiên tìm thấy để trả về
        FieldError error = e.getBindingResult().getFieldError();
        String message = (error != null) ? error.getDefaultMessage() : "Dữ liệu không hợp lệ";
        return ResponseEntity.badRequest().body(message);
    }

    // 2. Hứng lỗi Logic (Email trùng, Role lỗi...) - Code cũ
    @ExceptionHandler(AppException.class)
    public ResponseEntity<String> handleAppException(AppException e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }

    // 3. Hứng lỗi hệ thống - Code cũ
    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleUnwantedException(Exception e) {
        e.printStackTrace();
        return ResponseEntity.status(500).body(MessageConstant.SYSTEM_ERROR);
    }
}