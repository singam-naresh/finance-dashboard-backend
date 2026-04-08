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
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        try {
            seedRoles();
            seedAdmin();
            log.info("event=SYSTEM_READY users={} roles={} db=connected",
                    userRepository.count(), roleRepository.count());
        } catch (Exception e) {
            log.error("event=STARTUP_FAILURE reason=\"DataInitializer failed\" error={}", e.getMessage(), e);
            throw e; // fail fast — do not start with broken seed data
        }
    }

    private void seedRoles() {
        if (roleRepository.count() == 0) {
            roleRepository.save(new Role("ROLE_VIEWER"));
            roleRepository.save(new Role("ROLE_ANALYST"));
            roleRepository.save(new Role("ROLE_ADMIN"));
            log.info("event=ROLES_SEEDED count=3");
        } else {
            log.info("event=ROLES_ALREADY_EXIST count={}", roleRepository.count());
        }
    }

    private void seedAdmin() {
        if (!userRepository.existsByUsername("admin")) {
            Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                    .orElseThrow(() -> new IllegalStateException(
                            "ROLE_ADMIN not found after seeding — check DB connection"));

            User admin = new User("admin", "admin@gmail.com",
                    passwordEncoder.encode("Admin@123"));
            admin.setRoles(Set.of(adminRole));
            userRepository.save(admin);
            log.info("event=ADMIN_SEEDED username=admin email=admin@gmail.com role=ROLE_ADMIN");
        } else {
            log.info("event=ADMIN_ALREADY_EXISTS username=admin");
        }
    }
}
