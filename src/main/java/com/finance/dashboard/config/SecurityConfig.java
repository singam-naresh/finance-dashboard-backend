package com.finance.dashboard.config;

import com.finance.dashboard.security.JwtAccessDeniedHandler;
import com.finance.dashboard.security.JwtAuthEntryPoint;
import com.finance.dashboard.security.filter.JwtAuthenticationFilter;
import com.finance.dashboard.security.filter.StrictQueryParamFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final StrictQueryParamFilter  strictParamFilter;
    private final UserDetailsService      userDetailsService;
    private final JwtAuthEntryPoint       authEntryPoint;
    private final JwtAccessDeniedHandler  accessDeniedHandler;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter,
                          StrictQueryParamFilter strictParamFilter,
                          UserDetailsService userDetailsService,
                          JwtAuthEntryPoint authEntryPoint,
                          JwtAccessDeniedHandler accessDeniedHandler) {
        this.jwtAuthFilter       = jwtAuthFilter;
        this.strictParamFilter   = strictParamFilter;
        this.userDetailsService  = userDetailsService;
        this.authEntryPoint      = authEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(authEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
            )
            .authenticationProvider(authenticationProvider())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/api-docs/**", "/swagger-ui.html").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/api/users/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST,   "/api/records/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/records/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/records/**").hasRole("ADMIN")
                .requestMatchers("/api/dashboard/**").hasAnyRole("ANALYST", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/records/**").hasAnyRole("VIEWER", "ANALYST", "ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(strictParamFilter, JwtAuthenticationFilter.class);

        return http.build();
    }
}
