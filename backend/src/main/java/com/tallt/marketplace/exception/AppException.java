package com.tallt.marketplace.exception;

import lombok.Getter;

/**
 * Custom runtime exception for business logic errors.
 * Uses ErrorCode enum for standardized error handling.
 */
@Getter
public class AppException extends RuntimeException {
    private final ErrorCode errorCode;
    
    public AppException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }
    
    public AppException(ErrorCode errorCode, String customMessage) {
        super(customMessage);
        this.errorCode = errorCode;
    }
    
    public AppException(ErrorCode errorCode, Throwable cause) {
        super(errorCode.getMessage(), cause);
        this.errorCode = errorCode;
    }
}