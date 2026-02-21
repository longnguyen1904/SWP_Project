package com.tallt.marketplace.exception;

import lombok.Getter;

/**
 * Enum mã lỗi thống nhất cho toàn bộ API, đặt trong package exception vì gắn chặt với AppException.
 * TẠI SAO dùng Enum thay vì MessageConstant? Enum gắn code (int) và message (String) với nhau,
 * tránh sai code/message khi throw AppException; GlobalExceptionHandler chỉ cần lấy errorCode.getCode() và getMessage().
 */
@Getter
public enum ErrorCode {

    /** Lỗi hệ thống không lường trước (bug, DB sập,...). Handler Exception.class trả về code này. */
    UNCATEGORIZED_EXCEPTION(9999, "Lỗi hệ thống không xác định"),

    /** Email đã tồn tại khi đăng ký. Service throw AppException(USER_EXISTED). */
    USER_EXISTED(1001, "Email này đã được sử dụng, vui lòng chọn email khác!"),

    /** Sai email hoặc mật khẩu khi đăng nhập. Controller trả ApiResponse.fail(LOGIN_FAILED). */
    LOGIN_FAILED(1002, "Sai email hoặc mật khẩu!"),

    /** Role không tồn tại (vd: ID sai). Service throw AppException(ROLE_NOT_FOUND). */
    ROLE_NOT_FOUND(1003, "Quyền hạn (Role) không tồn tại trong hệ thống!"),

    /** Mật khẩu không đạt yêu cầu (vd: < 6 ký tự). Dùng cho validation hoặc logic đổi mật khẩu. */
    INVALID_PASSWORD(1004, "Mật khẩu phải có ít nhất 6 ký tự"),

    /** Lỗi validation DTO (@Valid): thiếu field, sai format. Handler MethodArgumentNotValidException dùng code này. */
    INVALID_KEY(1005, "Dữ liệu không hợp lệ"),

    /** Chưa đăng nhập hoặc token hết hạn/sai. Dùng trong JwtAuthenticationEntryPoint khi trả 401. */
    UNAUTHENTICATED(1006, "Bạn không có quyền truy cập (Unauthenticated)");

    private final int code;
    private final String message;

    ErrorCode(int code, String message) {
        this.code = code;
        this.message = message;
    }
}
