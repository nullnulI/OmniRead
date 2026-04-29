package com.omniread.backend.service.impl;

import com.omniread.backend.dto.CreateUserRequest;
import com.omniread.backend.dto.UserResponse;
import com.omniread.backend.entity.User;
import com.omniread.backend.repository.UserRepository;
import com.omniread.backend.service.UserManagementService;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserManagementServiceImpl implements UserManagementService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setRole(request.getRole());
        user.setStatus(request.getStatus());
        user.setSupplierCompanyName(request.getSupplierCompanyName());
        return UserResponse.from(userRepository.save(user));
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> listUsers() {
        return userRepository.findAll()
            .stream()
            .map(UserResponse::from)
            .collect(Collectors.toList());
    }
}
