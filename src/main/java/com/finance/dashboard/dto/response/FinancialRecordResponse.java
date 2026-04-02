package com.finance.dashboard.dto.response;

import com.finance.dashboard.model.FinancialRecord;
import com.finance.dashboard.model.FinancialRecord.RecordType;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
public class FinancialRecordResponse {
    private final Long id;
    private final BigDecimal amount;
    private final RecordType type;
    private final String category;
    private final LocalDate date;
    private final String description;
    private final Long userId;
    private final String username;
    private final LocalDateTime createdAt;

    public FinancialRecordResponse(FinancialRecord r) {
        this.id = r.getId();
        this.amount = r.getAmount();
        this.type = r.getType();
        this.category = r.getCategory();
        this.date = r.getDate();
        this.description = r.getDescription();
        this.userId = r.getUser().getId();
        this.username = r.getUser().getUsername();
        this.createdAt = r.getCreatedAt();
    }
}
