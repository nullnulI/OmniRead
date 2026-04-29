package com.omniread.backend.dto;

import com.omniread.backend.entity.enums.UserRole;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthResponse {

    private String tokenType;
    private String accessToken;
    private Long expiresInSeconds;
    private Long userId;
    private String email;
    private String fullName;
    private UserRole role;
}
