package com.circus.task.api.websocket;

import java.util.Map;
import java.util.UUID;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

/** 从 /api/ws/episodes/{episodeId} 提取订阅范围，MS1 不在握手阶段做用户鉴权。 */
// @Component：供 WebSocket 配置类注入为握手拦截器。
@Component
public class EpisodeHandshakeInterceptor implements HandshakeInterceptor {

    static final String EPISODE_ID_ATTRIBUTE = "episodeId";

    /** @Override：握手前解析 URL 中的 episodeId，失败则拒绝连接。 */
    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler webSocketHandler, Map<String, Object> attributes) {
        String path = request.getURI().getPath();
        String value = path.substring(path.lastIndexOf('/') + 1);
        try {
            attributes.put(EPISODE_ID_ATTRIBUTE, UUID.fromString(value));
            return true;
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    /** @Override：握手完成后无额外动作，连接登记交由 Handler 完成。 */
    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler webSocketHandler, Exception exception) {}
}
