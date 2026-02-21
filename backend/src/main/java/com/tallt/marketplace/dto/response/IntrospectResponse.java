package com.tallt.marketplace.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * DTO trả về kết quả kiểm tra Token: valid = true nếu token còn hiệu lực (chữ ký đúng và chưa hết hạn).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class IntrospectResponse {

    boolean valid;
}
