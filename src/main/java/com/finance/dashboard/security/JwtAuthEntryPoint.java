package com.finance.dashboard.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.finance.dashboard.dto.response.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;

/**
 * Returns a structured 401 JSON response when Spring Security rejects
 * an unauthenticated request (e.g. missing token, invalid token that
 * the filter didn't short-circuit).
 */
@Component
public class JwtAuthEntryPoint implements AuthenticationEntryPoint {

    private static final ObjectMapper MAPPER = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        if (response.isCommitted()) return;

        ApiErrorResponse body = ApiErrorResponse.builder()
                .status(HttpStatus.UNAUTHORIZED.value())
                .error(HttpStatus.UNAUTHORIZED.getReasonPhrase())
                .message("Authentication required — please provide a valid Bearer token")
                .path(request.getRequestURI())
                .timestamp(LocalDateTime.now())
                .build();

        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(MAPPER.writeValueAsString(body));
        response.getWriter().flush();
    }
}
