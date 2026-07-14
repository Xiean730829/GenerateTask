package com.circus.architecture;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.lang.reflect.Method;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import jakarta.validation.Valid;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEvent;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.RestController;

/**
 * 架构护栏测试：不验证业务结果，只锁定模块边界、关键注解和 MQ 不泄漏到业务模块的约束。
 * 任何人新增任务能力后都应保持本测试通过；若必须调整边界，应先有明确架构决策再改测试。
 */
class TaskInfrastructureSeamContractTest {

    private static final Path REPOSITORY_ROOT = Path.of("../..").toAbsolutePath().normalize();

    /** @Test：锁定发布确认配置和业务侧唯一发布入口。 */
    @Test
    void messagingUsesPublisherConfirmsAndExposesOnlyTheTaskExecutionPublisherSeam() throws Exception {
        String application = read("services/java-api/src/main/resources/application.yml");

        assertTrue(application.contains("publisher-confirm-type: correlated"));
        assertTrue(application.contains("publisher-returns: true"));
        assertTrue(application.contains("mandatory: true"));

        Class<?> topology = Class.forName("com.circus.messaging.RabbitTopologyConfig");
        Class<?> publisher = Class.forName("com.circus.messaging.TaskMessagePublisher");
        Class<?> message = Class.forName("com.circus.messaging.TaskExecutionMessage");
        Class.forName("com.circus.messaging.PublishConfirmHandler");
        Class.forName("com.circus.messaging.PublishOutcomeListener");

        assertTrue(Arrays.stream(topology.getDeclaredMethods()).anyMatch(method -> method.getName().equals("taskExchange")));
        Method[] publishMethods = Arrays.stream(publisher.getDeclaredMethods())
                .filter(method -> method.getName().equals("publish"))
                .toArray(Method[]::new);
        assertEquals(1, publishMethods.length);
        assertEquals(message, publishMethods[0].getParameterTypes()[0]);
    }

    /** @Test：锁定任务命令、回写与事件 seam，并禁止业务模块直接使用 RabbitTemplate。 */
    @Test
    void taskModuleProvidesCommandCallbackAndLifecycleEventSeamsWithoutMqLeakage() throws Exception {
        Class<?> command = Class.forName("com.circus.task.api.TaskCommandInterface");
        Class<?> createCommand = Class.forName("com.circus.task.api.dto.CreateTaskCommand");
        Class<?> callback = Class.forName("com.circus.task.internal.TaskCallbackService");
        Class<?> lifecycle = Class.forName("com.circus.task.api.event.TaskLifecycleEvent");
        Class<?> running = Class.forName("com.circus.task.api.event.TaskRunningEvent");
        Class<?> succeeded = Class.forName("com.circus.task.api.event.TaskSucceededEvent");
        Class<?> failed = Class.forName("com.circus.task.api.event.TaskFailedEvent");

        assertEquals(3, command.getDeclaredMethods().length);
        assertTrue(createCommand.isRecord());
        assertEquals(1, callback.getDeclaredMethods().length);
        assertEquals(ApplicationEvent.class, lifecycle.getSuperclass());
        assertEquals(lifecycle, running.getSuperclass());
        assertEquals(lifecycle, succeeded.getSuperclass());
        assertEquals(lifecycle, failed.getSuperclass());
        assertNoBusinessModuleImportsRabbitTemplate();
    }

    /** @Test：锁定编排和 WebSocket 只订阅事件，不反向依赖 HTTP 回写控制器。 */
    @Test
    void orchestrationAndWebSocketConsumeLifecycleEventsInsteadOfHttpCallbacks() throws Exception {
        Class<?> handler = Class.forName("com.circus.orchestration.api.TaskResultHandler");
        Class<?> dispatcher = Class.forName("com.circus.orchestration.application.TaskResultDispatcher");
        Class.forName("com.circus.orchestration.application.PipelinePolicy");
        Class.forName("com.circus.task.api.websocket.EpisodeSocketRegistry");
        Class.forName("com.circus.task.api.websocket.TaskLifecycleWebSocketPublisher");

        assertEquals(2, handler.getDeclaredMethods().length);
        assertTrue(Arrays.stream(dispatcher.getDeclaredMethods())
                .anyMatch(method -> method.getName().equals("onTaskSucceeded")));
    }

    /** @Test：锁定启动所需的 Spring/Bean Validation 注解，防止重构时误删入口能力。 */
    @Test
    void frameworkEntrypointsKeepTheirRequiredSpringAndValidationAnnotations() throws Exception {
        Class<?> publisher = Class.forName("com.circus.messaging.TaskMessagePublisher");
        Class<?> callbackController = Class.forName("com.circus.task.internal.InternalTaskResultController");
        Class<?> websocketConfig = Class.forName("com.circus.task.api.websocket.EpisodeWebSocketConfig");
        Method reportResult = callbackController.getDeclaredMethod("reportResult", java.util.UUID.class,
                Class.forName("com.circus.task.internal.TaskResult"));

        assertTrue(publisher.isAnnotationPresent(Component.class));
        assertTrue(callbackController.isAnnotationPresent(RestController.class));
        assertTrue(websocketConfig.isAnnotationPresent(Configuration.class));
        assertTrue(reportResult.getParameters()[1].isAnnotationPresent(Valid.class));
    }

    private static void assertNoBusinessModuleImportsRabbitTemplate() throws IOException {
        Path sourceRoot = REPOSITORY_ROOT.resolve("services/java-api/src/main/java/com/circus");
        try (var paths = Files.walk(sourceRoot)) {
            assertFalse(paths
                    .filter(path -> path.toString().endsWith(".java"))
                    .filter(path -> !path.toString().contains("/messaging/"))
                    .anyMatch(path -> readUnchecked(path).contains("org.springframework.amqp.rabbit.core.RabbitTemplate")));
        }
        try (var paths = Files.walk(sourceRoot)) {
            assertFalse(paths
                    .filter(path -> path.toString().endsWith(".java"))
                    .filter(path -> !path.toString().contains("/messaging/"))
                    .filter(path -> !path.toString().contains("/task/"))
                    .anyMatch(path -> readUnchecked(path).contains("com.circus.messaging.")));
        }
    }

    private static String read(String relativePath) throws IOException {
        return Files.readString(REPOSITORY_ROOT.resolve(relativePath));
    }

    private static String readUnchecked(Path path) {
        try {
            return Files.readString(path);
        } catch (IOException exception) {
            throw new IllegalStateException(exception);
        }
    }
}
