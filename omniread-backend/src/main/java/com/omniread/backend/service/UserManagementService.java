package com.omniread.backend.service;

import com.omniread.backend.dto.CreateUserRequest;
import com.omniread.backend.dto.UserResponse;
import java.util.List;

public interface UserManagementService {

    UserResponse createUser(CreateUserRequest request);

    List<UserResponse> listUsers();
}
