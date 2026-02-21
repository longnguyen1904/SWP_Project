package com.tallt.marketplace.mapper;

import com.tallt.marketplace.dto.request.UserCreationRequest;
import com.tallt.marketplace.dto.response.UserResponse;
import com.tallt.marketplace.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * MapStruct mapper: chuyển đổi giữa DTO (Request/Response) và Entity User.
 * TẠI SAO dùng MapStruct? Tự động sinh code set/get theo tên field, giảm boilerplate và lỗi copy-paste.
 * componentModel = "spring": implementation là Spring Bean, inject vào Service được.
 */
@Mapper(componentModel = "spring")
public interface UserMapper {

    /**
     * UserCreationRequest -> User (chỉ map email, fullName). Các field passwordHash, username, role, isActive do Service set.
     */
    @Mapping(target = "userID", ignore = true)
    @Mapping(target = "username", ignore = true)
    @Mapping(target = "passwordHash", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    User toUser(UserCreationRequest request);

    /**
     * User -> UserResponse (thông tin tài nguyên User trả về cho client). roleName lấy từ user.role.roleName.
     */
    @Mapping(source = "role.roleName", target = "roleName")
    UserResponse toUserResponse(User user);
}
