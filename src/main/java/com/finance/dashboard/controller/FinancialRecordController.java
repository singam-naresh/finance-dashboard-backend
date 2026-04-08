package com.finance.dashboard.controller;

import com.finance.dashboard.dto.request.FinancialRecordRequest;
import com.finance.dashboard.dto.response.ApiErrorResponse;
import com.finance.dashboard.dto.response.FinancialRecordResponse;
import com.finance.dashboard.model.FinancialRecord.RecordType;
import com.finance.dashboard.service.FinancialRecordService;
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
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@Validated
@RestController
@RequestMapping("/api/records")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Financial Records", description = "CRUD and filtering for financial records")
public class FinancialRecordController {

    private final FinancialRecordService recordService;

    // ── Write endpoints ──────────────────────────────────────────────────────
    // Authorization enforced in SecurityConfig (ANALYST + ADMIN for POST/PUT, ADMIN for DELETE)

    @PostMapping
    @Operation(
        summary = "Create a financial record",
        description = "Requires ROLE_ANALYST or ROLE_ADMIN. Record is owned by the authenticated user."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Record created"),
        @ApiResponse(responseCode = "400", description = "Validation error",
            content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
        @ApiResponse(responseCode = "409", description = "Duplicate record detected")
    })
    public ResponseEntity<FinancialRecordResponse> create(@Valid @RequestBody FinancialRecordRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(recordService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a financial record",
        description = "Requires ROLE_ANALYST or ROLE_ADMIN. ANALYST can only update their own records.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Record updated"),
        @ApiResponse(responseCode = "400", description = "Validation error"),
        @ApiResponse(responseCode = "403", description = "Not the record owner"),
        @ApiResponse(responseCode = "404", description = "Record not found")
    })
    public ResponseEntity<FinancialRecordResponse> update(
            @Parameter(description = "Record ID", required = true)
            @PathVariable @Positive Long id,
            @Valid @RequestBody FinancialRecordRequest request) {
        return ResponseEntity.ok(recordService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft-delete a financial record", description = "Requires ROLE_ADMIN.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Record deleted"),
        @ApiResponse(responseCode = "404", description = "Record not found")
    })
    public ResponseEntity<Void> delete(
            @Parameter(description = "Record ID", required = true)
            @PathVariable @Positive Long id) {
        recordService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ── Read endpoints ───────────────────────────────────────────────────────
    // Authorization enforced in SecurityConfig (VIEWER + ANALYST + ADMIN for GET)

    @GetMapping
    @Operation(
        summary = "Get all records (paginated)",
        description = "Supported sortBy values: date, amount, category. direction: asc or desc."
    )
    public ResponseEntity<Page<FinancialRecordResponse>> getAll(
            @Parameter(description = "Page number (0-based)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size", example = "20")
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort field: date | amount | category", example = "date")
            @RequestParam(defaultValue = "date") String sortBy,
            @Parameter(description = "Sort direction: asc | desc", example = "desc")
            @RequestParam(defaultValue = "desc") String direction) {
        return ResponseEntity.ok(recordService.getAll(page, size, sortBy, direction));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a record by ID")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Record found"),
        @ApiResponse(responseCode = "404", description = "Record not found")
    })
    public ResponseEntity<FinancialRecordResponse> getById(
            @Parameter(description = "Record ID", required = true)
            @PathVariable @Positive Long id) {
        return ResponseEntity.ok(recordService.getById(id));
    }

    // ── Filter endpoints ─────────────────────────────────────────────────────

    @GetMapping("/filter/type")
    @Operation(
        summary = "Filter records by type",
        description = "Accepted values: INCOME, EXPENSE."
    )
    @ApiResponse(responseCode = "400", description = "Invalid or missing 'type' parameter")
    public ResponseEntity<Page<FinancialRecordResponse>> filterByType(
            @Parameter(description = "Record type: INCOME or EXPENSE", required = true)
            @RequestParam RecordType type,
            @PageableDefault(size = 20, sort = "date") Pageable pageable) {
        return ResponseEntity.ok(recordService.filterByType(type, pageable));
    }

    @GetMapping("/filter/category")
    @Operation(
        summary = "Filter records by category",
        description = "Case-sensitive category match."
    )
    @ApiResponse(responseCode = "400", description = "Missing 'category' parameter")
    public ResponseEntity<Page<FinancialRecordResponse>> filterByCategory(
            @Parameter(description = "Category name (e.g. Salary, Rent)", required = true)
            @RequestParam String category,
            @PageableDefault(size = 20, sort = "date") Pageable pageable) {
        return ResponseEntity.ok(recordService.filterByCategory(category, pageable));
    }

    @GetMapping("/filter/date-range")
    @Operation(
        summary = "Filter records by date range",
        description = "Both 'from' and 'to' required in ISO format (yyyy-MM-dd)."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Filtered records (may be empty)"),
        @ApiResponse(responseCode = "400", description = "Missing or invalid date parameters")
    })
    public ResponseEntity<Page<FinancialRecordResponse>> filterByDateRange(
            @Parameter(description = "Start date (yyyy-MM-dd)", required = true)
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @Parameter(description = "End date (yyyy-MM-dd)", required = true)
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @PageableDefault(size = 20, sort = "date") Pageable pageable) {
        return ResponseEntity.ok(recordService.filterByDateRange(from, to, pageable));
    }
}
