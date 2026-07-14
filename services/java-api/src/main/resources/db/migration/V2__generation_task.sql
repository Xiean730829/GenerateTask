-- =====================================================================
-- V2：GenerationTask 任务控制表（task 模块，任务状态的唯一拥有者）
-- 设计要点：
--   1. task 模块先仅声明 project/episode/shot/panel UUID；V3 在业务表创建后补齐
--      归属外键，保证 MS1 任务必须属于同一 Project/Episode。
--   2. 幂等范围依赖 app_user，V3 按 user + endpoint + key 补齐唯一约束及请求指纹。
--   3. 状态机与终态守卫由 Java 代码控制，DB 仅用 CHECK 约束取值范围。
-- =====================================================================

-- 共享触发器函数：行更新时自动刷新 updated_at（V3 复用）
create or replace function set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create table generation_task (
    id              uuid         primary key default gen_random_uuid(),
    project_id      uuid         not null,
    episode_id      uuid         not null,          -- MS1：所有任务必须关联当前生产分集
    shot_id         uuid,
    panel_id        uuid,
    task_type       varchar(64)  not null,
    status          varchar(16)  not null default 'pending',
    attempt         integer      not null default 0,   -- 执行编号：taskId + attempt 唯一标识一次执行
    progress        integer      not null default 0,
    retry_count     integer      not null default 0,
    max_retries     integer      not null default 3,   -- 默认 3；retry_count 达上限或 retryable=false 时拒绝 retry
    retryable       boolean,                            -- 失败是否可重试；非失败态为空
    idempotency_key varchar(200),
    trace_id        varchar(128),                       -- 仅用于日志关联，不作幂等依据
    result_ref      jsonb,                              -- 结果对象引用，如 {"scriptId": "..."}
    result_json     jsonb,                              -- 完整回写结果快照
    error_code      varchar(128),
    error_message   text,
    cost_points     integer,                            -- MS1 只保留字段，不做积分结算
    created_at      timestamptz  not null default now(),
    queued_at       timestamptz,
    started_at      timestamptz,
    finished_at     timestamptz,
    updated_at      timestamptz  not null default now(),
    constraint ck_gen_task_type check (task_type in (
        'script.generate', 'shot.generate', 'asset.extract', 'asset.image.generate',
        'keyframe.generate', 'video.generate', 'audio.subtitle', 'export.compose')),
    constraint ck_gen_task_status check (status in (
        'pending', 'queued', 'running', 'succeeded', 'failed', 'retrying', 'canceled')),
    constraint ck_gen_task_progress check (progress between 0 and 100),
    constraint ck_gen_task_attempt  check (attempt >= 0),
    constraint ck_gen_task_retries  check (retry_count >= 0 and max_retries >= 0)
);

comment on table generation_task is 'GenerationTask 任务控制对象；Java 为任务状态唯一拥有者，Python 仅经 /internal 回写';

-- 查询/轮询用索引
create index idx_gen_task_project on generation_task (project_id);
create index idx_gen_task_episode on generation_task (episode_id);
create index idx_gen_task_status  on generation_task (status);
create index idx_gen_task_shot    on generation_task (shot_id);
create index idx_gen_task_panel   on generation_task (panel_id);

-- 幂等的用户、接口、请求指纹字段及唯一索引依赖 app_user，
-- 在 V3 创建用户/业务表后统一补齐，避免把 task_type 误当作接口范围。

create trigger trg_gen_task_updated_at
    before update on generation_task
    for each row execute function set_updated_at();
