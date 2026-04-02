package com.finance.dashboard.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter @AllArgsConstructor
public class MonthlySummaryResponse {
    private String month;       // e.g. "2024-03"
    private String type;        // INCOME | EXPENSE
    private BigDecimal total;
}
