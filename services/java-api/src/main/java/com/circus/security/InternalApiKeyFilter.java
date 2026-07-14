package com.circus.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** 仅保护 /internal/** Worker 回写接口的共享密钥过滤器；公开 /api 不经此过滤器。 */
// @Component：自动加入 Spring 的 Servlet Filter 链。
@Component
public class InternalApiKeyFilter extends OncePerRequestFilter {

    private final String apiKey;

    public InternalApiKeyFilter(@Value("${app.internal-api-key}") String apiKey) {
        this.apiKey = apiKey;
    }

    /** @Override：非 /internal/ 请求跳过该内部鉴权规则。 */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/internal/");
    }

    /** @Override：校验 Python Worker 在 X-Internal-Api-Key 传入的共享密钥。 */
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws IOException, ServletException {
        if (!apiKey.equals(request.getHeader("X-Internal-Api-Key"))) {
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "UNAUTHORIZED_INTERNAL");
            return;
        }
        filterChain.doFilter(request, response);
    }
}
