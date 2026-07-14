package com.circus.task.api.websocket;

import java.io.IOException;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

/** 按 episode 维护工作台 WebSocket 会话，供生命周期事件广播使用。 */
// @Component：同一应用进程内共享这份在线会话注册表。
@Component
public class EpisodeSocketRegistry {

    private final ConcurrentHashMap<UUID, Set<WebSocketSession>> sessionsByEpisode = new ConcurrentHashMap<>();

    /** 将新连接登记到其订阅的 episode。 */
    public void register(UUID episodeId, WebSocketSession session) {
        sessionsByEpisode.computeIfAbsent(episodeId, ignored -> ConcurrentHashMap.newKeySet()).add(session);
    }

    /** 连接断开或发送失败时移除会话，避免重复推送。 */
    public void unregister(UUID episodeId, WebSocketSession session) {
        Set<WebSocketSession> sessions = sessionsByEpisode.get(episodeId);
        if (sessions == null) {
            return;
        }
        sessions.remove(session);
        if (sessions.isEmpty()) {
            sessionsByEpisode.remove(episodeId, sessions);
        }
    }

    /** 向同一 episode 的所有在线工作台发送完整 task.updated 快照。 */
    public void broadcast(UUID episodeId, String payload) {
        Set<WebSocketSession> sessions = sessionsByEpisode.getOrDefault(episodeId, Set.of());
        for (WebSocketSession session : sessions) {
            try {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(payload));
                } else {
                    unregister(episodeId, session);
                }
            } catch (IOException exception) {
                unregister(episodeId, session);
            }
        }
    }
}
