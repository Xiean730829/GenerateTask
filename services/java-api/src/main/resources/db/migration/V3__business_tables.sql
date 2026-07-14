-- =====================================================================
-- V3：MS1 业务表（内容对象）
-- 约定：snake_case 列名；UUID 主键 default gen_random_uuid()（pgcrypto 见 V1）；
--       时间统一 timestamptz；结构化/自由字段用 jsonb；枚举用 CHECK 约束。
-- 覆盖 MS1 全任务链路：项目→分集→材料→剧本/故事圣经→镜头(含提示词版本/资产覆盖)
--       →资产(含版本/引用)→关键帧→片段(含版本/视频)→媒体文件→时间线→导出。
-- 循环外键（project↔episode 等）在文件末尾用 ALTER 补齐。
-- =====================================================================

-- ------- 用户（MS1 单用户；仅为 owner_user_id 提供引用完整性）-------
create table app_user (
    id           uuid        primary key default gen_random_uuid(),
    display_name varchar(100),
    created_at   timestamptz not null default now()
);
comment on table app_user is 'MS1 单 demo 用户占位；未来接入鉴权后扩展';

-- MS1 单 demo 用户种子：后续 owner_user_id 和任务幂等范围均以它为完整性引用。
insert into app_user (id, display_name)
values ('00000000-0000-0000-0000-000000000001', 'MS1 Demo User');

-- ------- 项目 -------
create table project (
    id                     uuid         primary key default gen_random_uuid(),
    owner_user_id          uuid         not null references app_user (id),
    name                   varchar(200) not null,
    project_type           varchar(32)  not null default 'single_episode',
    stage                  varchar(32)  not null default 'material',
    target_duration_seconds integer,
    aspect_ratio           varchar(16),
    style                  text,
    default_episode_id     uuid         not null,          -- 循环引用；使用应用预生成 UUID + 可延迟复合外键在事务提交时校验
    created_at             timestamptz  not null default now(),
    updated_at             timestamptz  not null default now(),
    constraint ck_project_type  check (project_type in ('single_episode', 'full_series')),
    constraint ck_project_stage check (stage in (
        'material', 'script', 'shot', 'asset', 'panel', 'video', 'audio', 'timeline', 'export'))
);
create index idx_project_owner on project (owner_user_id);

-- ------- 分集 -------
create table episode (
    id                     uuid         primary key default gen_random_uuid(),
    project_id             uuid         not null references project (id) on delete cascade,
    title                  varchar(200),
    synopsis               text,
    order_index            integer      not null default 0,
    target_duration_seconds integer,
    status                 varchar(32)  not null default 'created',
    created_at             timestamptz  not null default now(),
    updated_at             timestamptz  not null default now(),
    constraint uq_episode_order unique (project_id, order_index),
    constraint uq_episode_project_id unique (project_id, id)
);
create index idx_episode_project on episode (project_id);

-- ------- 输入材料 -------
create table source_material (
    id         uuid         primary key default gen_random_uuid(),
    project_id uuid         not null references project (id) on delete cascade,
    type       varchar(16)  not null,
    text       text,
    title      varchar(200),
    status               varchar(32)  not null default 'ready',
    source_media_file_id uuid,
    created_at           timestamptz  not null default now(),
    updated_at           timestamptz  not null default now(),
    constraint ck_material_type check (type in ('text', 'file')),
    constraint ck_material_content check (
        (type = 'text' and text is not null and source_media_file_id is null)
        or (type = 'file' and text is null and source_media_file_id is not null)
    )
);
create index idx_material_project on source_material (project_id);

-- ------- 故事圣经（随剧本产出的项目级一致性约束）-------
create table story_bible (
    id            uuid        primary key default gen_random_uuid(),
    project_id    uuid        not null unique references project (id) on delete cascade,
    metadata      jsonb       not null,
    world_settings jsonb      not null,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

-- ------- 剧本（库实体；由 script.generate 产物落库转换而来）-------
create table script (
    id              uuid         primary key default gen_random_uuid(),
    episode_id      uuid         not null references episode (id) on delete cascade,
    title           varchar(300),
    logline         text,
    story_promise   text,
    story_summary   text,
    final_outcome   text,
    content         text,                              -- 可读剧本全文（GeneratedScript.scriptText）
    target_duration_seconds integer,
    language        varchar(32),
    genre           varchar(128),
    style           text,
    characters      jsonb        not null default '[]'::jsonb,
    scenes          jsonb        not null default '[]'::jsonb,
    generation_meta jsonb,                             -- 仅保留质量、Prompt 版本、改写次数等内部追溯信息
    version         integer      not null default 1,
    status          varchar(16)  not null default 'draft',
    confirmed_at    timestamptz,
    created_at      timestamptz  not null default now(),
    updated_at      timestamptz  not null default now(),
    constraint ck_script_status check (status in ('draft', 'confirmed')),
    constraint ck_script_version check (version >= 1),
    constraint ck_script_target_duration check (target_duration_seconds is null or target_duration_seconds >= 1),
    constraint uq_script_episode unique (episode_id)
);
create index idx_script_episode on script (episode_id);

-- ------- 镜头（可编辑最小单位）-------
create table shot (
    id                        uuid         primary key default gen_random_uuid(),
    episode_id                uuid         not null references episode (id) on delete cascade,
    script_id                 uuid         not null references script (id) on delete cascade,
    order_index               integer      not null default 0,
    duration_seconds          numeric(8, 2),
    shot_size                 varchar(64),
    characters                jsonb,                   -- 出场角色名数组
    action                    text,
    dialogue                  text,
    camera_movement           varchar(64),
    generation_prompt         text,                    -- 仅展示便利字段；生产以 current_prompt_revision 为准
    current_prompt_revision_id uuid,                   -- 循环引用，末尾补外键
    status                    varchar(32)  not null default 'draft',
    created_at                timestamptz  not null default now(),
    updated_at                timestamptz  not null default now(),
    constraint ck_shot_duration check (duration_seconds is null or duration_seconds >= 0),
    constraint uq_shot_order unique (script_id, order_index),
    constraint uq_shot_episode_id unique (episode_id, id)
);
create index idx_shot_episode on shot (episode_id);
create index idx_shot_script  on shot (script_id);

-- ------- 镜头提示词版本（用户可见、不可变）-------
create table shot_prompt_revision (
    id                  uuid         primary key default gen_random_uuid(),
    shot_id             uuid         not null references shot (id) on delete cascade,
    revision_no         integer      not null,
    prompt              text         not null,
    source              varchar(16)  not null,
    asset_reference_ids jsonb,                          -- 引用的资产 id 数组
    asset_overrides_snapshot jsonb not null default '[]'::jsonb,
    created_at          timestamptz  not null default now(),
    constraint ck_prompt_rev_source check (source in ('generated', 'manual', 'assistant')),
    constraint ck_prompt_rev_asset_overrides check (jsonb_typeof(asset_overrides_snapshot) = 'array'),
    constraint uq_prompt_rev unique (shot_id, revision_no),
    constraint uq_prompt_rev_shot_id unique (shot_id, id)
);
create index idx_prompt_rev_shot on shot_prompt_revision (shot_id);

-- ------- 用户级资产 -------
create table asset (
    id                  uuid         primary key default gen_random_uuid(),
    owner_user_id       uuid         not null references app_user (id),
    type                varchar(16)  not null,
    name                varchar(200) not null,
    description         text,
    reference_image_media_file_id uuid,
    current_revision_id uuid,                           -- 循环引用，末尾补外键
    attributes          jsonb        not null default '{}'::jsonb,   -- 角色音色等存于此
    locked              boolean      not null default false,
    created_at          timestamptz  not null default now(),
    constraint ck_asset_type check (type in ('character', 'prop', 'scene', 'style'))
);
create index idx_asset_owner on asset (owner_user_id);

-- ------- 资产版本（共享 Asset 的不可变快照）-------
create table asset_revision (
    id          uuid         primary key default gen_random_uuid(),
    asset_id    uuid         not null references asset (id) on delete cascade,
    revision_no integer      not null,
    attributes  jsonb        not null,
    created_at  timestamptz  not null default now(),
    constraint uq_asset_rev unique (asset_id, revision_no),
    constraint uq_asset_rev_asset_id unique (asset_id, id)
);
create index idx_asset_rev_asset on asset_revision (asset_id);

-- ------- 资产引用（Asset 在 Project/Episode/Shot 中的生产上下文映射）-------
create table asset_reference (
    id         uuid         primary key default gen_random_uuid(),
    asset_id   uuid         not null references asset (id) on delete cascade,
    project_id uuid         not null references project (id) on delete cascade,
    episode_id uuid         references episode (id) on delete cascade,
    shot_id    uuid         references shot (id) on delete cascade,
    usage      varchar(16)  not null,
    created_at timestamptz  not null default now(),
    constraint ck_asset_ref_usage check (usage in ('character', 'prop', 'scene', 'style', 'reference')),
    constraint ck_asset_ref_shot_requires_episode check (shot_id is null or episode_id is not null)
);
create index idx_asset_ref_project on asset_reference (project_id);
create index idx_asset_ref_asset   on asset_reference (asset_id);

-- ------- 镜头资产局部覆盖（仅本镜头生效；每镜头每资产一条）-------
create table shot_asset_override (
    id         uuid         primary key default gen_random_uuid(),
    shot_id    uuid         not null references shot (id) on delete cascade,
    asset_id   uuid         not null references asset (id),
    attributes jsonb        not null,                  -- 仅保存真实覆盖；仅关联 Asset 时写 asset_reference
    created_at timestamptz  not null default now(),
    constraint uq_shot_asset_override unique (shot_id, asset_id)
);

-- ------- 媒体文件元数据（二进制存 OSS；库内仅存元数据）-------
create table media_file (
    id                  uuid         primary key default gen_random_uuid(),
    owner_user_id       uuid         references app_user (id),
    project_id          uuid         references project (id) on delete cascade,
    episode_id          uuid         references episode (id) on delete cascade,
    file_type           varchar(32)  not null,
    bucket              varchar(128),
    object_key          text         not null,
    mime_type           varchar(128),
    size_bytes          bigint,
    duration_seconds    numeric(10, 2),
    width               integer,
    height              integer,
    related_object_type varchar(32),
    related_object_id   uuid,
    created_at          timestamptz  not null default now(),
    constraint ck_media_file_type check (file_type in (
        'source_upload', 'asset_reference_image', 'keyframe_image',
        'panel_video', 'audio', 'subtitle', 'export')),
    constraint ck_media_file_size check (size_bytes is null or size_bytes >= 0),
    constraint ck_media_file_duration check (duration_seconds is null or duration_seconds >= 0),
    constraint ck_media_file_dimensions check (
        (width is null or width >= 1) and (height is null or height >= 1)
    )
);
create index idx_media_project on media_file (project_id);
create index idx_media_related on media_file (related_object_type, related_object_id);

-- 资产参考图候选与用户确认状态。数据库保存 media_file_id，而不是会过期的签名 URL。
create table asset_reference_image (
    id            uuid        primary key default gen_random_uuid(),
    asset_id      uuid        not null references asset (id) on delete cascade,
    media_file_id uuid        not null references media_file (id) on delete cascade,
    status        varchar(16) not null default 'candidate',
    created_at    timestamptz not null default now(),
    constraint ck_asset_reference_image_status check (status in ('candidate', 'selected', 'rejected')),
    constraint uq_asset_reference_image unique (asset_id, media_file_id)
);
create unique index uq_asset_reference_image_selected
    on asset_reference_image (asset_id) where status = 'selected';

-- ------- 关键帧候选 -------
create table keyframe (
    id                 uuid        primary key default gen_random_uuid(),
    shot_id            uuid        not null references shot (id) on delete cascade,
    media_file_id      uuid        not null references media_file (id),
    prompt_revision_id uuid        references shot_prompt_revision (id),
    status             varchar(16) not null default 'candidate',
    created_at         timestamptz not null default now(),
    constraint ck_keyframe_status check (status in ('candidate', 'selected', 'rejected', 'stale'))
);
create index idx_keyframe_shot on keyframe (shot_id);
create unique index uq_keyframe_selected_per_shot
    on keyframe (shot_id) where status = 'selected';

-- ------- 剧情片段（由多镜头按 TimeSpec 聚合；视频最小生产单位）-------
create table panel (
    id                  uuid         primary key default gen_random_uuid(),
    episode_id          uuid         not null references episode (id) on delete cascade,
    name                varchar(200),
    order_index         integer      not null default 0,
    duration_seconds    numeric(8, 2),
    time_spec           jsonb,
    current_revision_id uuid,                           -- 循环引用，末尾补外键
    created_at          timestamptz  not null default now(),
    constraint uq_panel_order unique (episode_id, order_index),
    constraint uq_panel_episode_id unique (episode_id, id)
);
create index idx_panel_episode on panel (episode_id);

-- Panel 成员是可校验的关系数据；公开 API 的 shotIds 由本表按 order_index 投影。
create table panel_shot (
    panel_id    uuid    not null,
    episode_id  uuid    not null,
    shot_id     uuid    not null,
    order_index integer not null,
    primary key (panel_id, shot_id),
    constraint uq_panel_shot_order unique (panel_id, order_index),
    constraint fk_panel_shot_panel_episode
        foreign key (episode_id, panel_id) references panel (episode_id, id) on delete cascade,
    constraint fk_panel_shot_shot_episode
        foreign key (episode_id, shot_id) references shot (episode_id, id) on delete cascade
);

-- ------- 片段组装快照（不可变；PanelVideo 的唯一生成输入）-------
create table panel_revision (
    id                      uuid         primary key default gen_random_uuid(),
    panel_id                uuid         not null references panel (id) on delete cascade,
    revision_no             integer      not null,
    shot_prompt_revision_ids jsonb       not null,
    asset_revision_ids      jsonb        not null,
    keyframe_media_ids      jsonb        not null,
    created_at              timestamptz  not null default now(),
    constraint uq_panel_rev unique (panel_id, revision_no),
    constraint uq_panel_rev_panel_id unique (panel_id, id)
);
create index idx_panel_rev_panel on panel_revision (panel_id);

-- ------- 片段视频 -------
create table panel_video (
    id                uuid         primary key default gen_random_uuid(),
    panel_id          uuid         not null references panel (id) on delete cascade,
    panel_revision_id uuid         not null,
    task_id           uuid         references generation_task (id),
    media_file_id     uuid         references media_file (id),
    status            varchar(16)  not null default 'pending',
    confirmed         boolean      not null default false,
    created_at        timestamptz  not null default now(),
    constraint ck_panel_video_status check (status in ('pending', 'running', 'succeeded', 'failed', 'stale')),
    constraint fk_panel_video_revision_owner
        foreign key (panel_id, panel_revision_id) references panel_revision (panel_id, id) on delete cascade
);
create index idx_panel_video_panel on panel_video (panel_id);

-- ------- 时间线（每集一份当前时间线）-------
create table timeline (
    id             uuid         primary key default gen_random_uuid(),
    episode_id     uuid         not null unique references episode (id) on delete cascade,
    status         varchar(32)  not null default 'draft',
    video_track    jsonb,                               -- 轨道元素引用 media_file / panel_video
    audio_track    jsonb,
    subtitle_track jsonb,
    created_at     timestamptz  not null default now(),
    updated_at     timestamptz  not null default now()
);

-- ------- 导出成片 -------
create table export (
    id               uuid         primary key default gen_random_uuid(),
    timeline_id      uuid         not null references timeline (id) on delete cascade,
    task_id          uuid         references generation_task (id),
    media_file_id    uuid         references media_file (id),
    status           varchar(16)  not null default 'pending',
    object_key       text,
    format           varchar(16),
    resolution       varchar(32),
    duration_seconds numeric(10, 2),
    size_bytes       bigint,
    created_at       timestamptz  not null default now(),
    finished_at      timestamptz,
    constraint ck_export_status check (status in ('pending', 'queued', 'running', 'succeeded', 'failed', 'canceled'))
);
create index idx_export_timeline on export (timeline_id);

-- =====================================================================
-- 关系完整性补齐（被引用表已存在后再加）
-- =====================================================================
alter table project add constraint fk_project_default_episode
    foreign key (id, default_episode_id) references episode (project_id, id)
    deferrable initially deferred;
alter table source_material add constraint fk_source_material_media_file
    foreign key (source_media_file_id) references media_file (id);
alter table shot add constraint fk_shot_current_prompt_revision_owner
    foreign key (id, current_prompt_revision_id) references shot_prompt_revision (shot_id, id);
alter table asset add constraint fk_asset_current_revision_owner
    foreign key (id, current_revision_id) references asset_revision (asset_id, id);
alter table asset add constraint fk_asset_reference_image
    foreign key (reference_image_media_file_id) references media_file (id);
alter table panel add constraint fk_panel_current_revision_owner
    foreign key (id, current_revision_id) references panel_revision (panel_id, id);
alter table keyframe add constraint fk_keyframe_prompt_revision_owner
    foreign key (shot_id, prompt_revision_id) references shot_prompt_revision (shot_id, id);
alter table asset_reference add constraint fk_asset_ref_project_episode
    foreign key (project_id, episode_id) references episode (project_id, id);
alter table asset_reference add constraint fk_asset_ref_episode_shot
    foreign key (episode_id, shot_id) references shot (episode_id, id);

-- GenerationTask 是 task 模块的状态拥有者，但其归属必须由数据库保证。
alter table generation_task
    add column owner_user_id uuid not null references app_user (id),
    add column idempotency_operation varchar(160),
    add column request_fingerprint char(64),
    add constraint ck_gen_task_idempotency_scope check (
        (idempotency_key is null and idempotency_operation is null and request_fingerprint is null)
        or (idempotency_key is not null and idempotency_operation is not null and request_fingerprint is not null)
    ),
    add constraint fk_gen_task_project foreign key (project_id) references project (id),
    add constraint fk_gen_task_project_episode
        foreign key (project_id, episode_id) references episode (project_id, id),
    add constraint fk_gen_task_episode_shot
        foreign key (episode_id, shot_id) references shot (episode_id, id),
    add constraint fk_gen_task_episode_panel
        foreign key (episode_id, panel_id) references panel (episode_id, id);
create unique index uq_gen_task_idempotency_scope
    on generation_task (owner_user_id, idempotency_operation, idempotency_key)
    where idempotency_key is not null;

-- =====================================================================
-- updated_at 自动刷新触发器（复用 V2 的 set_updated_at()）
-- =====================================================================
create trigger trg_project_updated_at     before update on project     for each row execute function set_updated_at();
create trigger trg_episode_updated_at     before update on episode     for each row execute function set_updated_at();
create trigger trg_story_bible_updated_at before update on story_bible for each row execute function set_updated_at();
create trigger trg_script_updated_at      before update on script      for each row execute function set_updated_at();
create trigger trg_shot_updated_at        before update on shot        for each row execute function set_updated_at();
create trigger trg_source_material_updated_at before update on source_material for each row execute function set_updated_at();
create trigger trg_timeline_updated_at    before update on timeline    for each row execute function set_updated_at();

-- 不可变 Revision 只能追加；应用层不得更新其内容，数据库同时阻止误更新。
create or replace function prevent_immutable_revision_update()
returns trigger as $$
begin
    raise exception '% rows are immutable', tg_table_name;
end;
$$ language plpgsql;

create trigger trg_shot_prompt_revision_immutable
    before update on shot_prompt_revision for each row execute function prevent_immutable_revision_update();
create trigger trg_asset_revision_immutable
    before update on asset_revision for each row execute function prevent_immutable_revision_update();
create trigger trg_panel_revision_immutable
    before update on panel_revision for each row execute function prevent_immutable_revision_update();
