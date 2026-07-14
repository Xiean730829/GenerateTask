package com.circus.task.api.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/** 注册与 asyncapi.yaml 对齐的原生 WebSocket 路径。 */
// @Configuration：声明 WebSocket 路由配置。
@Configuration
// @EnableWebSocket：启用 Spring 原生 WebSocket 支持，非 STOMP。
@EnableWebSocket
public class EpisodeWebSocketConfig implements WebSocketConfigurer {

    private final EpisodeWebSocketHandler handler;
    private final EpisodeHandshakeInterceptor handshakeInterceptor;

    public EpisodeWebSocketConfig(EpisodeWebSocketHandler handler, EpisodeHandshakeInterceptor handshakeInterceptor) {
        this.handler = handler;
        this.handshakeInterceptor = handshakeInterceptor;
    }

    /** @Override：将 Handler、路径参数解析器和允许来源绑定为一个 WebSocket 端点。 */
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(handler, "/api/ws/episodes/{episodeId}")
                .addInterceptors(handshakeInterceptor)
                .setAllowedOrigins("*");
    }
}
