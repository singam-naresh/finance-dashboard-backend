package com.finance.dashboard.config;

import com.finance.dashboard.model.Role;
import com.finance.dashboard.model.User;
import com.finance.dashboard.repository.RoleRepository;
import com.finance.dashboard.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Seed roles if not present (idempotent)
        if (roleRepository.count() == 0) {
            roleRepository.save(new Role("ROLE_VIEWER"));
            roleRepository.save(new Role("ROLE_ANALYST"));
            roleRepository.save(new Role("ROLE_ADMIN"));
        }

        // Seed admin user if not present (idempotent)
        if (!userRepository.existsByUsername("admin")) {
            Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                    .orElseThrow(() -> new IllegalStateException("ROLE_ADMIN not found"));

            User admin = new User("admin", "admin@finance.com",
                    passwordEncoder.encode("Admin@123"));
            admin.setRoles(Set.of(adminRole));
            userRepository.save(admin);
        }

        long users = userRepository.count();
        long roles = roleRepository.count();
        log.info("event=SYSTEM_READY users={} roles={} db=connected", users, roles);
    }
}
