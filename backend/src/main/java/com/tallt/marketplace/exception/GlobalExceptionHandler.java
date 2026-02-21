package com.tallt.marketplace.exception;

import com.tallt.marketplace.dto.request.ApiResponse;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Trái tim của hệ thống xử lý lỗi: TẤT CẢ API (thành công hay thất bại) đều trả về cùng format ApiResponse.
 * Các handler ở đây chỉ xử lý khi CÓ LỖI (exception được throw). Controller trả ApiResponse.ok(result) khi thành công.
 *
 * Thứ tự xử lý: Spring ưu tiên handler cụ thể (AppException, MethodArgumentNotValidException)
 * trước, sau đó mới tới Exception.class (bắt mọi thứ còn lại).
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Lỗi không lường trước (bug, DB sập, NullPointer,...).
     * TẠI SAO dùng Exception.class? Để bắt mọi exception chưa được xử lý ở trên,
     * tránh client nhận trang lỗi trắng; luôn trả về ApiResponse với code 9999.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleUnwantedException(Exception e) {
        e.printStackTrace();
        ApiResponse<Object> response = ApiResponse.fail(
                ErrorCode.UNCATEGORIZED_EXCEPTION.getCode(),
                ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    /**
     * Lỗi nghiệp vụ do mình chủ động throw (AppException) trong Service.
     * TẠI SAO trả về 400 (Bad Request)? Vì lỗi do dữ liệu/ hành động của client (vd: email trùng, role sai),
     * không phải lỗi server. Lấy code và message từ ErrorCode trong exception rồi bọc vào ApiResponse.
     */
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Object>> handleAppException(AppException e) {
        ErrorCode errorCode = e.getErrorCode();
        ApiResponse<Object> response = ApiResponse.fail(
                errorCode.getCode(),
                errorCode.getMessage()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * Lỗi validation từ DTO (@Valid): thiếu field, sai format, min/max,...
     * TẠI SAO lấy message từ field đầu tiên? Để trả về lỗi cụ thể (vd: "Email không được để trống")
     * thay vì message chung. Code dùng INVALID_KEY (1005) thống nhất cho mọi lỗi validation.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidationException(MethodArgumentNotValidException e) {
        FieldError firstError = e.getBindingResult().getFieldError();
        String message = (firstError != null) ? firstError.getDefaultMessage() : ErrorCode.INVALID_KEY.getMessage();
        ApiResponse<Object> response = ApiResponse.fail(
                ErrorCode.INVALID_KEY.getCode(),
                message
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
}
