package com.finance.dashboard.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Tracks failed login attempts per username using an in-memory Caffeine cache.
 * After MAX_ATTEMPTS failures within the lockout window, the account is blocked
 * for LOCKOUT_MINUTES minutes.
 *
 * This is a stateless-friendly approach — no DB writes, no Redis required.
 * For multi-instance deployments, replace the cache with a shared store (Redis).
 */
@Service
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS    = 5;
    private static final int LOCKOUT_MINUTES = 5;

    // Cache: username → failed attempt count, auto-expires after lockout window
    private final Cache<String, AtomicInteger> attemptsCache = Caffeine.newBuilder()
            .expireAfterWrite(LOCKOUT_MINUTES, TimeUnit.MINUTES)
            .maximumSize(10_000)
            .build();

    /** Call on every failed login attempt. */
    public void recordFailure(String username) {
        AtomicInteger attempts = attemptsCache.get(username, k -> new AtomicInteger(0));
        attempts.incrementAndGet();
    }

    /** Call on successful login to clear the counter. */
    public void recordSuccess(String username) {
        attemptsCache.invalidate(username);
    }

    /** Returns true if the account is currently locked. */
    public boolean isBlocked(String username) {
        AtomicInteger attempts = attemptsCache.getIfPresent(username);
        return attempts != null && attempts.get() >= MAX_ATTEMPTS;
    }

    /** Returns current failed attempt count (0 if no record). */
    public int getFailedAttempts(String username) {
        AtomicInteger attempts = attemptsCache.getIfPresent(username);
        return attempts == null ? 0 : attempts.get();
    }

    public int getMaxAttempts()    { return MAX_ATTEMPTS; }
    public int getLockoutMinutes() { return LOCKOUT_MINUTES; }
}
