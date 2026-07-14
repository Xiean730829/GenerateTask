package com.circus.task.api.websocket;

import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

/** 原生 JSON WebSocket handler；前端断线后通过 REST 任务列表进行状态校正。 */
// @Component：供 EpisodeWebSocketConfig 注册到 WebSocket 路径。
@Component
public class EpisodeWebSocketHandler extends TextWebSocketHandler {

    private final EpisodeSocketRegistry socketRegistry;

    public EpisodeWebSocketHandler(EpisodeSocketRegistry socketRegistry) {
        this.socketRegistry = socketRegistry;
    }

    /** @Override：握手成功后，将当前浏览器会话登记到指定 episode。 */
    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        socketRegistry.register(episodeId(session), session);
    }

    /** @Override：连接关闭后释放会话，防止继续向失效连接发送消息。 */
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        socketRegistry.unregister(episodeId(session), session);
    }

    private UUID episodeId(WebSocketSession session) {
        return (UUID) session.getAttributes().get(EpisodeHandshakeInterceptor.EPISODE_ID_ATTRIBUTE);
    }
}
