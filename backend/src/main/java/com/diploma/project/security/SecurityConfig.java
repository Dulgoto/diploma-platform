package com.diploma.project.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.http.HttpMethod;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .headers(headers -> headers.frameOptions(frame -> frame.disable()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**", "/h2-console/**")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/ads/**")
                        .permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/ads/**")
                        .authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/ads/**")
                        .authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/ads/**")
                        .authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/users/account")
                        .authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/users/account")
                        .authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/users/*")
                        .permitAll()
                        .requestMatchers("/api/favorites/**")
                        .authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/reviews/**")
                        .permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/reviews/**")
                        .authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/reviews/**")
                        .authenticated()
                        .requestMatchers("/api/notifications/**")
                        .authenticated()
                        .anyRequest()
                        .permitAll())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}