package com.tallt.marketplace.controller;

import com.tallt.marketplace.dto.request.ApiResponse;
import com.tallt.marketplace.dto.request.UserCreationRequest;
import com.tallt.marketplace.dto.response.UserResponse;
import com.tallt.marketplace.service.UserService;

import jakarta.validation.Valid;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import org.springframework.web.bind.annotation.*;

/**
 * Controller quản lý tài nguyên User theo RESTful (Resource-based routing).
 * TẠI SAO tách UserController riêng khỏi AuthenticationController?
 * Separation of Concerns: UserController chịu trách nhiệm CRUD cho tài nguyên "User" (Create, Read, Update, Delete).
 * Hành động "đăng ký" bản chất là "Tạo User mới" -> POST /users. AuthenticationController chỉ lo cấp/kiểm tra/thu hồi Token,
 * không thêm/sửa dữ liệu User. Một Controller một nhóm tài nguyên, URL rõ ràng: /users vs /auth.
 *
 * TẠI SAO trả về trực tiếp ApiResponse thay vì ResponseEntity<ApiResponse>? (Clean Controller)
 * Spring Boot @RestController mặc định serialize đối tượng trả về thành JSON và gửi kèm HTTP Status 200 OK. Khi thành công,
 * Controller chỉ cần return ApiResponse.ok(...), không cần bọc ResponseEntity.ok(...). Code ngắn gọn, tập trung vào nghiệp vụ.
 *
 * TẠI SAO lỗi vẫn trả về đúng mã 400, 404, 500? Controller chỉ xử lý nhánh thành công (200 OK). Khi có lỗi, Exception
 * được ném ra (vd: AppException, MethodArgumentNotValidException) và do GlobalExceptionHandler bắt. Tại Handler đó ta vẫn
 * dùng ResponseEntity để chủ động set HTTP status (400 Bad Request, 500 Internal Server Error) và body ApiResponse lỗi.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserController {

    UserService userService;

    /**
     * POST /api/users = Tạo User mới (Create). Bọc kết quả trong ApiResponse<UserResponse>.
     */
    @PostMapping
    public ApiResponse<UserResponse> createUser(@RequestBody @Valid UserCreationRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.createUser(request))
                .build();
    }
}
