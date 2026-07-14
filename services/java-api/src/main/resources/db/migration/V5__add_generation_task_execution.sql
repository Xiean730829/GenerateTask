-- 一条记录代表 Java 派发给 Worker 的一次不可变任务执行。
-- GenerationTask 仍只保存当前状态；本表保留每次派发的身份和结果历史。
create table generation_task_execution (
    -- Worker 回写主键；同一条派发消息的身份在整个生命周期内不变。
    message_id       uuid         primary key,
    -- 归属的当前任务；历史不反向塞入 generation_task 单行记录。
    task_id          uuid         not null,
    -- 该任务的第几次尝试；与 task_id 一起唯一。
    attempt          integer      not null,
    trace_id         varchar(128),
    -- 派发给 Python 的不可变输入，便于重放与排障。
    payload_snapshot jsonb        not null,
    status           varchar(16)  not null default 'queued',
    result_json      jsonb,
    error_code       varchar(128),
    error_message    text,
    created_at       timestamptz  not null default now(),
    published_at     timestamptz,
    started_at       timestamptz,
    finished_at      timestamptz,
    updated_at       timestamptz  not null default now(),
    constraint fk_gen_task_execution_task
        foreign key (task_id) references generation_task (id),
    -- 一次 attempt 只允许获得一个派发身份，重复发布必须复用/忽略而不是新增记录。
    constraint uq_gen_task_execution_task_attempt unique (task_id, attempt),
    constraint ck_gen_task_execution_attempt check (attempt >= 0),
    constraint ck_gen_task_execution_status check (status in (
        'queued', 'running', 'succeeded', 'failed', 'canceled'))
);

-- 按任务和尝试次数查询回写/历史时使用的索引。
create index idx_gen_task_execution_task_attempt
    on generation_task_execution (task_id, attempt);

-- 身份、追踪信息和请求负载在派发后不可变；回写只允许更新生命周期和结果字段。
create function prevent_generation_task_execution_dispatch_mutation()
returns trigger as $$
begin
    if new.message_id is distinct from old.message_id
        or new.task_id is distinct from old.task_id
        or new.attempt is distinct from old.attempt
        or new.trace_id is distinct from old.trace_id
        or new.payload_snapshot is distinct from old.payload_snapshot
        or new.created_at is distinct from old.created_at then
        raise exception 'generation_task_execution dispatch identity is immutable';
    end if;
    return new;
end;
$$ language plpgsql;

-- 所有 UPDATE 都经过此触发器，拒绝修改已派发的身份和输入快照。
create trigger trg_gen_task_execution_dispatch_immutable
    before update on generation_task_execution
    for each row execute function prevent_generation_task_execution_dispatch_mutation();

create trigger trg_gen_task_execution_updated_at
    before update on generation_task_execution
    for each row execute function set_updated_at();
