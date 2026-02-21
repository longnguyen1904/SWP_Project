package com.tallt.marketplace.exception;

import lombok.Getter;

/**
 * Exception nghiệp vụ do mình chủ động throw (email trùng, role không tồn tại,...).
 * Kế thừa RuntimeException để không bắt buộc khai báo trong signature.
 *
 * TẠI SAO constructor nhận ErrorCode thay vì String message?
 * Để chuẩn hóa mã lỗi (code) và message trên toàn API; GlobalExceptionHandler
 * chỉ cần lấy errorCode.getCode() và getMessage() để bọc vào ApiResponse.
 */
@Getter
public class AppException extends RuntimeException {

    private final ErrorCode errorCode;

    public AppException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }
}
