package com.tallt.marketplace.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * DTO trả về khi xác thực thành công: chỉ chứa Token và trạng thái authenticated.
 * TẠI SAO AuthenticationResponse chỉ có token + authenticated, không chứa email/fullName/roleName?
 * Separation of Concerns: Auth Controller chỉ đóng vai "Người bảo vệ" - cấp phát Token, kiểm tra Token,
 * thu hồi Token. Thông tin chi tiết User (email, fullName,...) thuộc tài nguyên User, client muốn thì gọi GET /users/me
 * (sau này) với Token đã lưu. Response xác thực chuẩn chỉ cần "bạn đã được cấp chìa khóa (token)" và "đã xác thực (authenticated)".
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AuthenticationResponse {

    /** JWT hoặc token tạm; client lưu để gửi kèm các request sau. */
    String token;

    /** true nếu xác thực thành công, client có thể dùng token. */
    boolean authenticated;
}
