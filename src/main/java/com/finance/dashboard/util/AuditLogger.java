package com.finance.dashboard.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Centralised structured audit logger.
 * All security and business events are emitted in key=value format
 * so they can be parsed by log aggregators (ELK, CloudWatch, Datadog).
 *
 * Format: event=EVENT_NAME key1=value1 key2=value2 ...
 */
public final class AuditLogger {

    private static final Logger log = LoggerFactory.getLogger("AUDIT");

    private AuditLogger() {}

    // ── Auth events ─────────────────────────────────────────────────────────

    public static void loginAttempt(String username) {
        log.info("event=LOGIN_ATTEMPT username={}", username);
    }

    public static void loginSuccess(String username, java.util.Set<String> roles) {
        log.info("event=LOGIN_SUCCESS username={} roles={}", username, roles);
    }

    public static void loginFailure(String username, String reason) {
        log.warn("event=LOGIN_FAILURE username={} reason=\"{}\"", username, reason);
    }

    public static void loginBlocked(String username, int attempts) {
        log.warn("event=LOGIN_BLOCKED username={} failedAttempts={} reason=\"account temporarily locked\"",
                username, attempts);
    }

    public static void userRegistered(String username) {
        log.info("event=USER_REGISTERED username={}", username);
    }

    // ── JWT events ──────────────────────────────────────────────────────────

    public static void tokenExpired(String username, String endpoint) {
        log.warn("event=TOKEN_EXPIRED username={} endpoint={}", username, endpoint);
    }

    public static void tokenInvalid(String endpoint, String reason) {
        log.warn("event=TOKEN_INVALID endpoint={} reason=\"{}\"", endpoint, reason);
    }

    // ── Record events ───────────────────────────────────────────────────────

    public static void recordCreated(String username, Long recordId,
                                     String type, java.math.BigDecimal amount, String category) {
        log.info("event=CREATE_RECORD user={} recordId={} type={} amount={} category={}",
                username, recordId, type, amount, category);
    }

    public static void recordUpdated(String username, Long recordId) {
        log.info("event=UPDATE_RECORD user={} recordId={}", username, recordId);
    }

    public static void recordDeleted(Long recordId) {
        log.info("event=DELETE_RECORD recordId={}", recordId);
    }

    public static void duplicateDetected(String username, String type, String category,
                                         java.time.LocalDate date) {
        log.warn("event=DUPLICATE_RECORD user={} type={} category={} date={}", username, type, category, date);
    }

    // ── Access control events ───────────────────────────────────────────────

    public static void accessDenied(String username, String endpoint) {
        log.warn("event=ACCESS_DENIED user={} endpoint={}", username, endpoint);
    }

    // ── Validation events ───────────────────────────────────────────────────

    public static void validationFailed(String endpoint, java.util.Map<String, String> fieldErrors) {
        log.warn("event=VALIDATION_FAILED endpoint={} fields={}", endpoint, fieldErrors);
    }

    public static void badRequest(String endpoint, String reason) {
        log.warn("event=BAD_REQUEST endpoint={} reason=\"{}\"", endpoint, reason);
    }

    // ── Dashboard events ────────────────────────────────────────────────────

    public static void dashboardQueried(String username,
                                        java.math.BigDecimal income,
                                        java.math.BigDecimal expenses) {
        log.info("event=DASHBOARD_QUERY user={} totalIncome={} totalExpenses={}", username, income, expenses);
    }
}
