package com.finance.dashboard.security.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.finance.dashboard.dto.response.ApiErrorResponse;
import com.finance.dashboard.util.AuditLogger;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

/**
 * Rejects requests that contain query parameters not declared for that endpoint.
 *
 * Only applied to the filter/* endpoints where strict contracts matter.
 * Pageable params (page, size, sort) are always allowed.
 */
@Component
public class StrictQueryParamFilter extends OncePerRequestFilter {

    private static final Set<String> PAGEABLE_PARAMS = Set.of("page", "size", "sort");

    // endpoint-path → allowed query params (excluding pageable)
    private static final Map<String, Set<String>> ALLOWED_PARAMS = Map.of(
            "/api/records/filter/type",       Set.of("type"),
            "/api/records/filter/category",   Set.of("category"),
            "/api/records/filter/date-range", Set.of("from", "to")
    );

    private static final ObjectMapper MAPPER = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String path = request.getRequestURI();
        Set<String> allowed = ALLOWED_PARAMS.get(path);

        if (allowed != null) {
            Set<String> received = request.getParameterMap().keySet();
            for (String param : received) {
                if (!PAGEABLE_PARAMS.contains(param) && !allowed.contains(param)) {
                    String msg = "Unknown query parameter '" + param
                            + "'. Allowed: " + allowed + " (plus page/size/sort)";
                    AuditLogger.badRequest(path, msg);
                    writeError(response, path, msg);
                    return;
                }
            }
        }

        chain.doFilter(request, response);
    }

    private void writeError(HttpServletResponse response,
                             String path, String message) throws IOException {
        ApiErrorResponse body = ApiErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .message(message)
                .path(path)
                .timestamp(LocalDateTime.now())
                .build();

        response.setStatus(HttpStatus.BAD_REQUEST.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(MAPPER.writeValueAsString(body));
    }
}
