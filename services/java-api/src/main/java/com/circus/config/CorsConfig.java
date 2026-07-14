package com.circus.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 全局跨域配置。
 *
 * <p>仅对外 {@code /api/**} 公开接口开放前端开发服务器来源；内部回写接口
 * {@code /internal/**} 不开放跨域（只允许受信任的 Python Worker 在内网调用）。
 * 允许来源通过配置项 {@code app.cors.allowed-origins} 注入，多个来源用逗号分隔。
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    /** 允许跨域访问的前端来源列表（逗号分隔） */
    private final String[] allowedOrigins;

    public CorsConfig(@Value("${app.cors.allowed-origins}") String allowedOrigins) {
        // 拆分并去除空白，兼容 "a, b" 这类写法
        this.allowedOrigins = allowedOrigins.split("\\s*,\\s*");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
