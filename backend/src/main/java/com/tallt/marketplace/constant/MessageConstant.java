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
    public static final String VALIDATION_FAILED = "Dữ liệu không hợp lệ";

    // System Messages
    public static final String SYSTEM_ERROR = "Lỗi hệ thống không xác định. Vui lòng thử lại sau.";

    // Success Messages
    public static final String REGISTER_SUCCESS = "Đăng ký tài khoản thành công!";
    public static final String LOGIN_SUCCESS = "Đăng nhập thành công!";

    // Vendor Messages
    public static final String VENDOR_NOT_FOUND = "Vendor không tồn tại";
    public static final String VENDOR_ALREADY_REGISTERED = "User đã đăng ký Vendor trước đó";
    public static final String VENDOR_NOT_VERIFIED = "Vendor chưa được xác thực";
    public static final String VENDOR_REGISTER_SUCCESS = "Đăng ký Vendor thành công";

    // Product Messages
    public static final String PRODUCT_NOT_FOUND = "Sản phẩm không tồn tại";
    public static final String PRODUCT_NOT_OWNER = "Bạn không có quyền thao tác trên sản phẩm này";
    public static final String PRODUCT_ALREADY_APPROVED = "Sản phẩm đã được duyệt trước đó";
    public static final String PRODUCT_CANNOT_UPDATE_APPROVED = "Không thể cập nhật sản phẩm đã được duyệt";

    // Wallet Messages
    public static final String WALLET_NOT_FOUND = "Ví không tồn tại";
    public static final String INSUFFICIENT_BALANCE = "Số dư không đủ để rút tiền";
}