package com.tallt.marketplace.constant;

public class MessageConstant {
    // Auth Messages
    public static final String EMAIL_ALREADY_EXISTS = "Email này đã được sử dụng, vui lòng chọn email khác!";
    public static final String LOGIN_FAILED = "Sai email hoặc mật khẩu!";
    public static final String ROLE_NOT_FOUND = "Quyền hạn (Role) không tồn tại trong hệ thống!";
    public static final String ACCOUNT_LOCKED = "Tài khoản của bạn đã bị khóa!";

    // Validation Messages
    public static final String EMAIL_REQUIRED = "Email không được để trống";
    public static final String PASSWORD_MIN_LENGTH = "Mật khẩu phải có ít nhất 6 ký tự";

    // System Messages
    public static final String SYSTEM_ERROR = "Lỗi hệ thống không xác định. Vui lòng thử lại sau.";

    // Success Messages
    public static final String REGISTER_SUCCESS = "Đăng ký tài khoản thành công!";
    public static final String LOGIN_SUCCESS = "Đăng nhập thành công!";
}