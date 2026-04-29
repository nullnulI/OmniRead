package com.omniread.backend.config;

import com.omniread.backend.security.JwtAuthenticationFilter;
import com.omniread.backend.security.OmniReadUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.Collections;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final OmniReadUserDetailsService userDetailsService;
    private final SecurityProblemHandler securityProblemHandler;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.cors()
            .and()
            .csrf().disable()
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .and()
            .exceptionHandling()
            .authenticationEntryPoint(securityProblemHandler)
            .accessDeniedHandler(securityProblemHandler)
            .and()
            .authorizeRequests()
            .antMatchers(HttpMethod.POST, "/api/v1/auth/register", "/api/v1/auth/login").permitAll()
            .antMatchers(HttpMethod.GET, "/api/v1/books/admin").hasAnyRole("INVENTORY_ADMIN", "SYSTEM_ADMIN")
            .antMatchers(HttpMethod.GET, "/api/v1/books/**").permitAll()
            .antMatchers(HttpMethod.POST, "/api/v1/books").hasAnyRole("INVENTORY_ADMIN", "SYSTEM_ADMIN")
            .antMatchers(HttpMethod.PUT, "/api/v1/books/**").hasAnyRole("INVENTORY_ADMIN", "SYSTEM_ADMIN")
            .antMatchers("/api/v1/users", "/api/v1/users/**").hasRole("SYSTEM_ADMIN")
            .antMatchers("/api/v1/cart", "/api/v1/cart/**").hasRole("CUSTOMER")
            .antMatchers(HttpMethod.GET, "/api/v1/inventory/procurement-requests/me").hasRole("SUPPLIER")
            .antMatchers(HttpMethod.PUT, "/api/v1/inventory/procurement-requests/*/status").hasAnyRole("INVENTORY_ADMIN", "SUPPLIER", "SYSTEM_ADMIN")
            .antMatchers("/api/v1/inventory/procurement-requests", "/api/v1/inventory/procurement-requests/auto-generate")
            .hasAnyRole("INVENTORY_ADMIN", "SYSTEM_ADMIN")
            .antMatchers("/api/v1/inventory/**").hasAnyRole("INVENTORY_ADMIN", "SYSTEM_ADMIN")
            .antMatchers(HttpMethod.GET, "/api/v1/orders/admin").hasAnyRole("INVENTORY_ADMIN", "SYSTEM_ADMIN")
            .antMatchers(HttpMethod.PUT, "/api/v1/orders/*/status").hasAnyRole("INVENTORY_ADMIN", "SYSTEM_ADMIN")
            .antMatchers(HttpMethod.GET, "/api/v1/orders/customers/**").hasRole("SYSTEM_ADMIN")
            .antMatchers(HttpMethod.POST, "/api/v1/orders").hasRole("CUSTOMER")
            .antMatchers("/api/v1/orders", "/api/v1/orders/**").hasAnyRole("CUSTOMER", "SYSTEM_ADMIN")
            .anyRequest().authenticated()
            .and()
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Collections.singletonList("http://localhost:3000"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Collections.singletonList("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
