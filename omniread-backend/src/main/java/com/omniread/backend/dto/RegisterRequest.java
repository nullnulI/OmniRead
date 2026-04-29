package com.omniread.backend.dto;

import com.omniread.backend.entity.enums.UserRole;
import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {

    @NotBlank
    private String fullName;

    @Email
    @NotBlank
    private String email;

    @NotBlank
    @Size(min = 8, max = 72)
    private String password;

    private String phone;

    @NotNull
    private UserRole role = UserRole.CUSTOMER;

    private String supplierCompanyName;
}
