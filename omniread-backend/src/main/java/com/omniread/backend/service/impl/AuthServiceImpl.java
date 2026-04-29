package com.omniread.backend.service.impl;

import com.omniread.backend.dto.AuthResponse;
import com.omniread.backend.dto.LoginRequest;
import com.omniread.backend.dto.RegisterRequest;
import com.omniread.backend.dto.UserResponse;
import com.omniread.backend.entity.User;
import com.omniread.backend.entity.enums.AccountStatus;
import com.omniread.backend.entity.enums.UserRole;
import com.omniread.backend.repository.UserRepository;
import com.omniread.backend.security.JwtService;
import com.omniread.backend.security.OmniReadUserDetails;
import com.omniread.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }
        if (request.getRole() == UserRole.SYSTEM_ADMIN || request.getRole() == UserRole.INVENTORY_ADMIN) {
            throw new IllegalArgumentException("Admin accounts must be created by an existing system administrator");
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setRole(request.getRole());
        user.setSupplierCompanyName(request.getSupplierCompanyName());
        user.setStatus(AccountStatus.ACTIVE);

        User savedUser = userRepository.save(user);
        return buildAuthResponse(new OmniReadUserDetails(savedUser));
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        return buildAuthResponse((OmniReadUserDetails) authentication.getPrincipal());
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse currentUser(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
        return UserResponse.from(user);
    }

    private AuthResponse buildAuthResponse(OmniReadUserDetails userDetails) {
        return AuthResponse.builder()
            .tokenType("Bearer")
            .accessToken(jwtService.generateToken(userDetails))
            .expiresInSeconds(jwtService.getExpirationSeconds())
            .userId(userDetails.getId())
            .email(userDetails.getEmail())
            .fullName(userDetails.getFullName())
            .role(userDetails.getAuthorities()
                .stream()
                .findFirst()
                .map(authority -> authority.getAuthority().replace("ROLE_", ""))
                .map(UserRole::valueOf)
                .orElse(null))
            .build();
    }
}
