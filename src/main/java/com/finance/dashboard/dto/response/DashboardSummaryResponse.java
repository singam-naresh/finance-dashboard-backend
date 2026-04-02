package com.finance.dashboard.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter @Builder
public class DashboardSummaryResponse {
    private BigDecimal totalIncome;
    private BigDecimal totalExpenses;
    private BigDecimal netBalance;
    private List<CategorySummaryResponse> categoryTotals;
    private List<MonthlySummaryResponse> monthlySummary;
    private List<FinancialRecordResponse> recentTransactions;
}
