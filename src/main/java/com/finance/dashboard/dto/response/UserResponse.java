package com.finance.dashboard.dto.response;

import com.finance.dashboard.model.User;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

@Getter
public class UserResponse {
    private final Long id;
    private final String username;
    private final String email;
    private final boolean active;
    private final Set<String> roles;
    private final LocalDateTime createdAt;

    public UserResponse(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.email = user.getEmail();
        this.active = user.isActive();
        this.roles = user.getRoles().stream().map(r -> r.getName()).collect(Collectors.toSet());
        this.createdAt = user.getCreatedAt();
    }
}
