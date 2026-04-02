package com.finance.dashboard.service;

import com.finance.dashboard.dto.request.LoginRequest;
import com.finance.dashboard.dto.request.RegisterRequest;
import com.finance.dashboard.dto.response.AuthResponse;
import com.finance.dashboard.dto.response.UserResponse;
import com.finance.dashboard.exception.AccountLockedException;
import com.finance.dashboard.exception.ConflictException;
import com.finance.dashboard.exception.ResourceNotFoundException;
import com.finance.dashboard.model.Role;
import com.finance.dashboard.model.User;
import com.finance.dashboard.repository.RoleRepository;
import com.finance.dashboard.repository.UserRepository;
import com.finance.dashboard.security.LoginAttemptService;
import com.finance.dashboard.security.util.JwtUtils;
import com.finance.dashboard.util.AuditLogger;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String DEFAULT_ROLE = "ROLE_VIEWER";

    private final UserRepository        userRepository;
    private final RoleRepository        roleRepository;
    private final PasswordEncoder       passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils              jwtUtils;
    private final LoginAttemptService   loginAttemptService;

    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ConflictException("Username already taken: " + request.getUsername());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email already registered: " + request.getEmail());
        }

        Role viewerRole = roleRepository.findByName(DEFAULT_ROLE)
                .orElseThrow(() -> new ResourceNotFoundException("Default role not found"));

        User user = new User(request.getUsername(), request.getEmail(),
                passwordEncoder.encode(request.getPassword()));
        user.getRoles().add(viewerRole);

        User saved = userRepository.save(user);
        AuditLogger.userRegistered(saved.getUsername());
        return new UserResponse(saved);
    }

    public AuthResponse login(LoginRequest request) {
        String username = request.getUsername();
        AuditLogger.loginAttempt(username);

        if (loginAttemptService.isBlocked(username)) {
            AuditLogger.loginBlocked(username, loginAttemptService.getFailedAttempts(username));
            throw new AccountLockedException(
                    "Too many failed attempts. Account locked for "
                    + loginAttemptService.getLockoutMinutes() + " minutes. Try again later.");
        }

        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, request.getPassword()));

            UserDetails userDetails = (UserDetails) auth.getPrincipal();
            loginAttemptService.recordSuccess(username);

            String token = jwtUtils.generateToken(userDetails);
            Set<String> roles = userDetails.getAuthorities().stream()
                    .map(a -> a.getAuthority())
                    .collect(Collectors.toSet());

            AuditLogger.loginSuccess(username, roles);
            return new AuthResponse(token, username, roles);

        } catch (BadCredentialsException ex) {
            loginAttemptService.recordFailure(username);
            int remaining = loginAttemptService.getMaxAttempts()
                            - loginAttemptService.getFailedAttempts(username);
            AuditLogger.loginFailure(username,
                    "bad credentials, remaining attempts=" + Math.max(remaining, 0));
            throw ex;
        }
    }
}
