package com.tallt.marketplace.exception;

import com.tallt.marketplace.constant.MessageConstant;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Hứng lỗi Logic (Email trùng, Role lỗi...)
    @ExceptionHandler(AppException.class)
    public ResponseEntity<String> handleAppException(AppException e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }

    // Hứng lỗi hệ thống (Bug, DB sập...)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleUnwantedException(Exception e) {
        e.printStackTrace(); // In lỗi ra console để debug
        return ResponseEntity.status(500).body(MessageConstant.SYSTEM_ERROR);
    }
}