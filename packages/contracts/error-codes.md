# 统一 error.code 参考清单

> 本文件为契约参考（非规范约束）：集中登记 `error.code` 常量，供前后端与 Worker 统一使用。
> 新增错误码请在此登记。`error.code` 在 Schema 中保持自由 string（便于演进），以本清单为事实来源。

## 一、HTTP 同步错误（REST 响应，走 ErrorEnvelope / ErrorResponse）

| code | HTTP | 含义 | 出现位置 |
| :-- | :--: | :-- | :-- |
| `VALIDATION_ERROR` | 400 | 请求体校验失败（缺字段、类型错误、额外字段等） | 公开 `/api/**` 各写接口 |
| `NOT_FOUND` | 404 | 资源不存在 | 各按 id 查询/操作接口 |
| `CONFLICT` | 409 | 与当前状态冲突（如对非 `failed` 任务 retry、对 `running` 任务 cancel、剧本已确认再次确认） | 任务/剧本等状态相关接口 |
| `IDEMPOTENCY_CONFLICT` | 409 | 相同 `Idempotency-Key` 但请求体不同 | 全部创建任务的 POST |
| `UNAUTHORIZED_INTERNAL` | 401 | 受信任 Worker 内部回写鉴权失败（缺失/错误 `X-Internal-Api-Key`） | `/internal/**` |
| `TASK_PUBLISH_CONFIRM_FAILED` | 500 | RabbitMQ publisher confirm 失败（同步创建阶段） | 创建任务时的消息发布 |
| `UNKNOWN` | 5xx | 未归类的兜底错误 | 兜底 |

## 二、任务回写 error.code（task-result.error.code，异步）

| code | retryable | 含义 | 产生方 |
| :-- | :--: | :-- | :-- |
| `MODEL_TEMPORARY_UNAVAILABLE` | true | 模型/供应商暂时不可用，可重试 | Python Worker |
| `SCRIPT_QUALITY_CHECK_FAILED` | false | 剧本二次质检仍不通过（附问题列表于 error.details 或 result） | script.generate |
| `TASK_PUBLISH_CONFIRM_FAILED` | false | 重试发布确认失败：`retrying → failed`，保存新 attempt 的该错误码，不回旧 attempt、不伪造 `queued` | Java 任务模块（Issue #8） |
| `MEDIA_GENERATION_FAILED` | 视情况 | 关键帧/视频/音频/导出等媒体生成失败（预留，媒体 payload 定稿后细化） | 媒体 Worker |

## 说明
- `retryable=false` 时禁止人工 retry，用户只能 cancel。
- 幂等判定键：`taskId + episodeId + attempt + messageId`；`traceId` 仅用于日志关联。
- 绝对终态：`succeeded`、`canceled`；`failed` 非终态（可重试、可取消）。
