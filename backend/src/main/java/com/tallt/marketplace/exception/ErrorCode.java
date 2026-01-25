package com.tallt.marketplace.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Centralized error codes for the entire application.
 * Each error code includes:
 * - CODE: Internal error code (for React to identify specific errors)
 * - MESSAGE: Human-readable message in Vietnamese
 * - HTTP_STATUS: HTTP status code for the response
 * 
 * This enum replaces MessageConstant and provides a unified error management system.
 */
@Getter
public enum ErrorCode {
    // ========== Success Codes ==========
    SUCCESS(2000, "Thành công", HttpStatus.OK),
    
    // ========== Authentication Errors (1000-1099) ==========
    USER_EXISTED(1001, "Email đã được đăng ký. Vui lòng sử dụng email khác", HttpStatus.BAD_REQUEST),
    USERNAME_EXISTED(1002, "Username này đã tồn tại, vui lòng nhập username khác", HttpStatus.BAD_REQUEST),
    USER_NOT_FOUND(1003, "Email hoặc Username không tồn tại trong hệ thống", HttpStatus.NOT_FOUND),
    INVALID_PASSWORD(1004, "Mật khẩu không chính xác", HttpStatus.UNAUTHORIZED),
    ACCOUNT_DISABLED(1005, "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên", HttpStatus.FORBIDDEN),
    UNAUTHORIZED(1006, "Token không hợp lệ hoặc đã hết hạn", HttpStatus.UNAUTHORIZED),
    LOGIN_FAILED(1007, "Sai email hoặc mật khẩu", HttpStatus.UNAUTHORIZED),
    
    // ========== Authorization & Role Errors (1100-1199) ==========
    ROLE_NOT_FOUND(1101, "Quyền hạn (Role) không tồn tại trong hệ thống", HttpStatus.NOT_FOUND),
    FORBIDDEN(1102, "Bạn không có quyền truy cập tài nguyên này", HttpStatus.FORBIDDEN),
    
    // ========== Validation Errors (2000-2099) ==========
    VALIDATION_ERROR(2001, "Dữ liệu không hợp lệ", HttpStatus.BAD_REQUEST),
    EMAIL_REQUIRED(2002, "Email không được để trống", HttpStatus.BAD_REQUEST),
    EMAIL_INVALID_FORMAT(2003, "Email không đúng định dạng", HttpStatus.BAD_REQUEST),
    PASSWORD_REQUIRED(2004, "Password không được để trống", HttpStatus.BAD_REQUEST),
    PASSWORD_MIN_LENGTH(2005, "Password phải có ít nhất 6 ký tự", HttpStatus.BAD_REQUEST),
    USERNAME_REQUIRED(2006, "Username không được để trống", HttpStatus.BAD_REQUEST),
    USERNAME_INVALID_FORMAT(2007, "Username không được chứa ký tự đặc biệt và dấu cách", HttpStatus.BAD_REQUEST),
    FULLNAME_REQUIRED(2008, "Họ tên không được để trống", HttpStatus.BAD_REQUEST),
    IDENTIFIER_REQUIRED(2009, "Vui lòng nhập Username hoặc Email", HttpStatus.BAD_REQUEST),
    
    // ========== General Errors (5000-5099) ==========
    INTERNAL_SERVER_ERROR(5001, "Lỗi hệ thống không xác định. Vui lòng thử lại sau", HttpStatus.INTERNAL_SERVER_ERROR),
    BAD_REQUEST(5002, "Yêu cầu không hợp lệ", HttpStatus.BAD_REQUEST),
    NOT_FOUND(5003, "Không tìm thấy tài nguyên", HttpStatus.NOT_FOUND);
    
    private final int code;
    private final String message;
    private final HttpStatus httpStatus;
    
    ErrorCode(int code, String message, HttpStatus httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }
    
    /**
     * Get HTTP status code as integer
     */
    public int getHttpStatusCode() {
        return httpStatus.value();
    }
}
