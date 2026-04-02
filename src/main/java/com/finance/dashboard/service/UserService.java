package com.finance.dashboard.service;

import com.finance.dashboard.dto.request.AssignRoleRequest;
import com.finance.dashboard.dto.response.UserResponse;
import com.finance.dashboard.exception.ResourceNotFoundException;
import com.finance.dashboard.model.Role;
import com.finance.dashboard.model.User;
import com.finance.dashboard.repository.RoleRepository;
import com.finance.dashboard.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(UserResponse::new);
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        return new UserResponse(findUserOrThrow(id));
    }

    @Transactional
    public UserResponse assignRole(Long userId, AssignRoleRequest request) {
        User user = findUserOrThrow(userId);
        Role role = roleRepository.findByName(request.getRoleName())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + request.getRoleName()));

        user.getRoles().add(role);
        log.info("Assigned role {} to user {}", role.getName(), user.getUsername());
        return new UserResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse removeRole(Long userId, String roleName) {
        User user = findUserOrThrow(userId);
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleName));

        user.getRoles().remove(role);
        log.info("Removed role {} from user {}", roleName, user.getUsername());
        return new UserResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse setActiveStatus(Long userId, boolean active) {
        User user = findUserOrThrow(userId);
        user.setActive(active);
        log.info("User {} active status set to {}", user.getUsername(), active);
        return new UserResponse(userRepository.save(user));
    }

    private User findUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }
}
