-- 一条记录代表 Java 派发给 Worker 的一次不可变任务执行。
-- GenerationTask 仍只保存当前状态；本表保留每次派发的身份和结果历史。
create table generation_task_execution (
    message_id       uuid         primary key,
    task_id          uuid         not null,
    attempt          integer      not null,
    trace_id         varchar(128),
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
    constraint uq_gen_task_execution_task_attempt unique (task_id, attempt),
    constraint ck_gen_task_execution_attempt check (attempt >= 0),
    constraint ck_gen_task_execution_status check (status in (
        'queued', 'running', 'succeeded', 'failed', 'canceled'))
);

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

create trigger trg_gen_task_execution_dispatch_immutable
    before update on generation_task_execution
    for each row execute function prevent_generation_task_execution_dispatch_mutation();

create trigger trg_gen_task_execution_updated_at
    before update on generation_task_execution
    for each row execute function set_updated_at();
