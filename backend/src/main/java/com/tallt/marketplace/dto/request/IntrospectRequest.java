package com.tallt.marketplace.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * DTO nhận chuỗi Token từ client khi gọi API Introspect (kiểm tra token còn hợp lệ không).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class IntrospectRequest {

    @NotBlank(message = "Token không được để trống")
    String token;
}
