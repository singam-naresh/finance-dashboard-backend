package com.finance.dashboard.service;

import com.finance.dashboard.dto.response.*;
import com.finance.dashboard.model.FinancialRecord.RecordType;
import com.finance.dashboard.repository.FinancialRecordRepository;
import com.finance.dashboard.util.AuditLogger;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final FinancialRecordRepository recordRepository;

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary() {
        BigDecimal totalIncome   = recordRepository.sumByType(RecordType.INCOME);
        BigDecimal totalExpenses = recordRepository.sumByType(RecordType.EXPENSE);
        BigDecimal netBalance    = totalIncome.subtract(totalExpenses);

        List<CategorySummaryResponse> categoryTotals = recordRepository.getCategoryTotals();

        List<MonthlySummaryResponse> monthlySummary = recordRepository.getMonthlySummaryRaw()
                .stream()
                .map(row -> new MonthlySummaryResponse(
                        (String) row[0],
                        (String) row[1],
                        (BigDecimal) row[2]))
                .collect(Collectors.toList());

        List<FinancialRecordResponse> recentTransactions = recordRepository
                .findTop5Recent(PageRequest.of(0, 5))
                .stream()
                .map(FinancialRecordResponse::new)
                .collect(Collectors.toList());

        String caller = resolveUsername();
        AuditLogger.dashboardQueried(caller, totalIncome, totalExpenses);

        return DashboardSummaryResponse.builder()
                .totalIncome(totalIncome)
                .totalExpenses(totalExpenses)
                .netBalance(netBalance)
                .categoryTotals(categoryTotals.isEmpty() ? Collections.emptyList() : categoryTotals)
                .monthlySummary(monthlySummary.isEmpty() ? Collections.emptyList() : monthlySummary)
                .recentTransactions(recentTransactions.isEmpty() ? Collections.emptyList() : recentTransactions)
                .build();
    }

    private String resolveUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null) ? auth.getName() : "unknown";
    }
}
