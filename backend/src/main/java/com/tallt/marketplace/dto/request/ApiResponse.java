package com.tallt.marketplace.dto.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Chuẩn hóa response cho MỌI API (thành công hoặc thất bại).
 * Pattern thực tế (Devteria): Client luôn nhận một cấu trúc thống nhất { code, message, result }
 * để dễ xử lý: chỉ cần if (code === 1000) thì dùng result, ngược lại hiển thị message.
 *
 * TẠI SAO dùng Generic T? Vì mỗi API trả về kiểu khác nhau (AuthenticationResponse, List<Product>,...)
 * nhưng luôn bọc trong cùng một "vỏ" ApiResponse.
 *
 * @param <T> Kiểu dữ liệu trả về (AuthenticationResponse, List<...>, v.v.)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    /**
     * Mã trạng thái: 1000 = thành công (mặc định), các mã khác = lỗi (theo ErrorCode).
     * TẠI SAO dùng code thay vì chỉ HTTP status? Để client có thể phân biệt nhiều loại lỗi
     * (1001 email trùng, 1003 sai mật khẩu,...) và xử lý/ hiển thị phù hợp.
     */
    @Builder.Default
    int code = 1000;

    /**
     * Thông báo dành cho người dùng (thường dùng khi lỗi).
     * @JsonInclude(NON_NULL): Khi message = null (trường hợp thành công) thì field này
     * không xuất hiện trong JSON -> response gọn hơn.
     */
    String message;

    /**
     * Dữ liệu trả về (user, token, list,...). Khi lỗi thường null.
     */
    T result;

    /**
     * Helper: tạo ApiResponse thành công. Code = 1000, message = null (sẽ bị ẩn nhờ NON_NULL).
     */
    public static <T> ApiResponse<T> ok(T result) {
        return ApiResponse.<T>builder()
                .code(1000)
                .result(result)
                .build();
    }

    /**
     * Helper: tạo ApiResponse lỗi. Dùng trong GlobalExceptionHandler và Controller (vd: login sai).
     */
    public static <T> ApiResponse<T> fail(int code, String message) {
        return ApiResponse.<T>builder()
                .code(code)
                .message(message)
                .result(null)
                .build();
    }
}
