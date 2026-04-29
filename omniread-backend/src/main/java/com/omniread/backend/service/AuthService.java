package com.omniread.backend.service;

import com.omniread.backend.dto.AuthResponse;
import com.omniread.backend.dto.LoginRequest;
import com.omniread.backend.dto.RegisterRequest;
import com.omniread.backend.dto.UserResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    UserResponse currentUser(String email);
}
