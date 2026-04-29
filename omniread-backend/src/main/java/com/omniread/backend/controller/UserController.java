package com.omniread.backend.controller;

import com.omniread.backend.dto.ApiResponse;
import com.omniread.backend.dto.CreateUserRequest;
import com.omniread.backend.dto.UserResponse;
import com.omniread.backend.service.UserManagementService;
import java.util.List;
import javax.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserManagementService userManagementService;

    @PostMapping
    public ApiResponse<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ApiResponse.success(userManagementService.createUser(request));
    }

    @GetMapping
    public ApiResponse<List<UserResponse>> listUsers() {
        return ApiResponse.success(userManagementService.listUsers());
    }
}
