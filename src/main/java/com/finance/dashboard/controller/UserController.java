package com.finance.dashboard.controller;

import com.finance.dashboard.dto.request.AssignRoleRequest;
import com.finance.dashboard.dto.response.ApiErrorResponse;
import com.finance.dashboard.dto.response.UserResponse;
import com.finance.dashboard.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Validated
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "User Management", description = "Admin-only user and role management")
public class UserController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "List all users (paginated)", description = "Requires ROLE_ADMIN.")
    public ResponseEntity<Page<UserResponse>> getAllUsers(
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(userService.getAllUsers(pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "User found"),
        @ApiResponse(responseCode = "404", description = "User not found",
            content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    public ResponseEntity<UserResponse> getUserById(
            @Parameter(description = "User ID", required = true)
            @PathVariable @Positive Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PostMapping("/{id}/roles")
    @Operation(
        summary = "Assign a role to a user",
        description = "Valid role names: ROLE_VIEWER, ROLE_ANALYST, ROLE_ADMIN"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Role assigned"),
        @ApiResponse(responseCode = "404", description = "User or role not found")
    })
    public ResponseEntity<UserResponse> assignRole(
            @PathVariable @Positive Long id,
            @Valid @RequestBody AssignRoleRequest request) {
        return ResponseEntity.ok(userService.assignRole(id, request));
    }

    @DeleteMapping("/{id}/roles/{roleName}")
    @Operation(summary = "Remove a role from a user")
    @ApiResponse(responseCode = "404", description = "User or role not found")
    public ResponseEntity<UserResponse> removeRole(
            @PathVariable @Positive Long id,
            @PathVariable String roleName) {
        return ResponseEntity.ok(userService.removeRole(id, roleName));
    }

    @PatchMapping("/{id}/activate")
    @Operation(summary = "Activate a user account")
    @ApiResponse(responseCode = "404", description = "User not found")
    public ResponseEntity<UserResponse> activate(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(userService.setActiveStatus(id, true));
    }

    @PatchMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate a user account", description = "Deactivated users cannot log in.")
    @ApiResponse(responseCode = "404", description = "User not found")
    public ResponseEntity<UserResponse> deactivate(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(userService.setActiveStatus(id, false));
    }
}
