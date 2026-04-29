package com.omniread.backend.controller;

import com.omniread.backend.dto.ApiResponse;
import com.omniread.backend.dto.AuthResponse;
import com.omniread.backend.dto.LoginRequest;
import com.omniread.backend.dto.RegisterRequest;
import com.omniread.backend.dto.UserResponse;
import com.omniread.backend.security.OmniReadUserDetails;
import com.omniread.backend.service.AuthService;
import javax.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.success(authService.register(request));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success(authService.login(request));
    }

    @GetMapping("/me")
    public ApiResponse<UserResponse> me(@AuthenticationPrincipal OmniReadUserDetails principal) {
        return ApiResponse.success(authService.currentUser(principal.getEmail()));
    }
}
