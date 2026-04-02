package com.finance.dashboard.dto.response;

import com.finance.dashboard.model.FinancialRecord.RecordType;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter @AllArgsConstructor
public class CategorySummaryResponse {
    private String category;
    private RecordType type;
    private BigDecimal total;
}
