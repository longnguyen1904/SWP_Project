package com.tallt.marketplace.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * DTO trả về khi client thao tác với tài nguyên User (vd: GET /users/1, POST /users).
 * TẠI SAO tách UserResponse riêng khỏi AuthenticationResponse?
 * Resource-based: User là một tài nguyên (CRUD); Authentication là "cấp Token". Trả về thông tin User
 * khi tạo/xem/sửa User (UserResponse); trả về Token khi xác thực (AuthenticationResponse). Một endpoint
 * một loại dữ liệu, tránh lẫn lộn trách nhiệm.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {

    Integer userID;
    String email;
    String username;
    String fullName;
    String roleName;
}
