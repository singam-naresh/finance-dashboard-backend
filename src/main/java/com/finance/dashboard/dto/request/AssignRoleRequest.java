package com.finance.dashboard.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class AssignRoleRequest {

    @NotBlank(message = "Role name is required")
    private String roleName;
}
