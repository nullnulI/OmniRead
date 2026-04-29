package com.omniread.backend.dto;

import com.omniread.backend.entity.User;
import com.omniread.backend.entity.enums.AccountStatus;
import com.omniread.backend.entity.enums.UserRole;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserResponse {

    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private UserRole role;
    private AccountStatus status;
    private String supplierCompanyName;

    public static UserResponse from(User user) {
        return UserResponse.builder()
            .id(user.getId())
            .fullName(user.getFullName())
            .email(user.getEmail())
            .phone(user.getPhone())
            .role(user.getRole())
            .status(user.getStatus())
            .supplierCompanyName(user.getSupplierCompanyName())
            .build();
    }
}
