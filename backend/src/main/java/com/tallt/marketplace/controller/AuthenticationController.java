package com.tallt.marketplace.controller;

import com.tallt.marketplace.dto.request.ApiResponse;
import com.tallt.marketplace.dto.request.AuthenticationRequest;
import com.tallt.marketplace.dto.request.IntrospectRequest;
import com.tallt.marketplace.dto.response.AuthenticationResponse;
import com.tallt.marketplace.dto.response.IntrospectResponse;
import com.tallt.marketplace.service.AuthenticationService;

import jakarta.validation.Valid;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import org.springframework.web.bind.annotation.*;

/**
 * Controller xác thực (Authentication): chỉ đóng vai "Người bảo vệ" - cấp phát Token, kiểm tra Token, thu hồi Token (Logout).
 * TẠI SAO không làm nhiệm vụ thêm/sửa dữ liệu User? Separation of Concerns: thao tác với tài nguyên User (đăng ký = tạo User)
 * thuộc UserController (POST /users). AuthenticationController chỉ phục vụ việc "xin chìa khóa (Token)" qua POST /auth/token.
 * Một controller một trách nhiệm, RESTful rõ ràng.
 *
 * TẠI SAO trả về trực tiếp ApiResponse thay vì ResponseEntity<ApiResponse>? (Clean Controller)
 * @RestController mặc định trả về object kèm HTTP 200 OK. Trả về trực tiếp ApiResponse giúp code gọn, tập trung vào nghiệp vụ.
 *
 * TẠI SAO lỗi vẫn trả về đúng mã? Controller chỉ lo lúc thành công. Khi có lỗi (vd: sai mật khẩu -> AppException),
 * GlobalExceptionHandler bắt và trả ResponseEntity với status 400/500 và body ApiResponse lỗi.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationController {

    AuthenticationService authenticationService;

    /**
     * POST /api/auth/token = Yêu cầu cấp Token (xác thực). Trả về JWT + authenticated trong ApiResponse.
     */
    @PostMapping("/token")
    public ApiResponse<AuthenticationResponse> getToken(@RequestBody @Valid AuthenticationRequest request) {
        return ApiResponse.<AuthenticationResponse>builder()
                .result(authenticationService.authenticate(request))
                .build();
    }

    /**
     * POST /api/auth/introspect = Kiểm tra token còn hợp lệ không. Nhận IntrospectRequest (token), trả IntrospectResponse (valid).
     */
    @PostMapping("/introspect")
    public ApiResponse<IntrospectResponse> introspect(@RequestBody @Valid IntrospectRequest request) {
        return ApiResponse.<IntrospectResponse>builder()
                .result(authenticationService.introspect(request))
                .build();
    }
}
