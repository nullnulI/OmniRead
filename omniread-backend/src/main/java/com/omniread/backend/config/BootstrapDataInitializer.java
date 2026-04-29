package com.omniread.backend.config;

import com.omniread.backend.entity.User;
import com.omniread.backend.entity.enums.AccountStatus;
import com.omniread.backend.entity.enums.UserRole;
import com.omniread.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

@Component
@Order(1)
@RequiredArgsConstructor
public class BootstrapDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${omniread.bootstrap.admin.enabled:true}")
    private boolean adminBootstrapEnabled;

    @Value("${omniread.bootstrap.admin.email:admin@omniread.local}")
    private String adminEmail;

    @Value("${omniread.bootstrap.admin.password}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(String... args) {
        if (!adminBootstrapEnabled || userRepository.existsByEmail(adminEmail)) {
            return;
        }

        User admin = new User();
        admin.setFullName("OmniRead System Admin");
        admin.setEmail(adminEmail);
        admin.setPasswordHash(passwordEncoder.encode(adminPassword));
        admin.setRole(UserRole.SYSTEM_ADMIN);
        admin.setStatus(AccountStatus.ACTIVE);
        userRepository.save(admin);
    }
}
