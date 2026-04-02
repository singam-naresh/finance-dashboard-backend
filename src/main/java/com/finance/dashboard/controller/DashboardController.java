package com.finance.dashboard.controller;

import com.finance.dashboard.dto.response.DashboardSummaryResponse;
import com.finance.dashboard.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Dashboard", description = "Aggregated financial analytics — requires ROLE_ANALYST or ROLE_ADMIN")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ANALYST', 'ADMIN')")
    @Operation(
        summary = "Get full dashboard summary",
        description = """
            Returns DB-level aggregated data:
            - Total income and expenses
            - Net balance (income - expenses)
            - Category-wise totals (sorted by total DESC)
            - Monthly breakdown (grouped by YYYY-MM, sorted latest first)
            - Last 5 recent transactions (sorted by date DESC)
            
            All values default to 0 / empty lists when no records exist.
            Requires ROLE_ANALYST or ROLE_ADMIN.
            """
    )
    @ApiResponse(responseCode = "200", description = "Summary returned (always succeeds, empty state handled)")
    @ApiResponse(responseCode = "403", description = "Insufficient role — VIEWER cannot access dashboard")
    public ResponseEntity<DashboardSummaryResponse> getSummary() {
        return ResponseEntity.ok(dashboardService.getSummary());
    }
}
