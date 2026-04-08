package com.finance.dashboard.repository;

import com.finance.dashboard.dto.response.CategorySummaryResponse;
import com.finance.dashboard.model.FinancialRecord;
import com.finance.dashboard.model.FinancialRecord.RecordType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface FinancialRecordRepository
        extends JpaRepository<FinancialRecord, Long>, JpaSpecificationExecutor<FinancialRecord> {

    // ── Aggregation (DB-level) ──────────────────────────────────────────────

    @Query("SELECT COALESCE(SUM(r.amount), 0) FROM FinancialRecord r WHERE r.type = :type")
    BigDecimal sumByType(@Param("type") RecordType type);

    @Query("""
        SELECT new com.finance.dashboard.dto.response.CategorySummaryResponse(
            r.category, r.type, SUM(r.amount)
        )
        FROM FinancialRecord r
        GROUP BY r.category, r.type
        ORDER BY SUM(r.amount) DESC
        """)
    List<CategorySummaryResponse> getCategoryTotals();

    @Query(value = """
        SELECT
            TO_CHAR(date, 'YYYY-MM') AS month,
            type,
            SUM(amount)              AS total
        FROM financial_records
        WHERE deleted = false
        GROUP BY TO_CHAR(date, 'YYYY-MM'), type
        ORDER BY month DESC
        """, nativeQuery = true)
    List<Object[]> getMonthlySummaryRaw();

    // Explicit ORDER BY ensures latest-first regardless of Pageable sort
    @Query("SELECT r FROM FinancialRecord r ORDER BY r.date DESC, r.createdAt DESC")
    List<FinancialRecord> findTop5Recent(Pageable pageable);

    // ── Duplicate detection ─────────────────────────────────────────────────

    @Query("""
        SELECT COUNT(r) > 0 FROM FinancialRecord r
        WHERE r.user.id = :userId
          AND r.amount   = :amount
          AND r.type     = :type
          AND r.category = :category
          AND r.date     = :date
        """)
    boolean existsDuplicate(
            @Param("userId")   Long userId,
            @Param("amount")   BigDecimal amount,
            @Param("type")     RecordType type,
            @Param("category") String category,
            @Param("date")     LocalDate date);

    // ── Filtered queries ────────────────────────────────────────────────────

    Page<FinancialRecord> findByType(RecordType type, Pageable pageable);

    Page<FinancialRecord> findByUserUsernameAndType(String username, RecordType type, Pageable pageable);

    Page<FinancialRecord> findByCategory(String category, Pageable pageable);

    Page<FinancialRecord> findByUserUsernameAndCategory(String username, String category, Pageable pageable);

    Page<FinancialRecord> findByUserUsername(String username, Pageable pageable);

    @Query("""
        SELECT r FROM FinancialRecord r
        WHERE r.date BETWEEN :from AND :to
        ORDER BY r.date DESC
        """)
    Page<FinancialRecord> findByDateRange(
            @Param("from") LocalDate from,
            @Param("to")   LocalDate to,
            Pageable pageable);
}
