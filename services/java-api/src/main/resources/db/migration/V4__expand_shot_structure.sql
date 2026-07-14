-- 完整保存 Python shot.generate 的镜头局部状态。
-- 已存在的历史 Shot 保持 NULL，以区别于“明确为空”的新生成数据。
alter table shot
    add column scene_index integer,
    add column environment_description text,
    add column character_instances jsonb,
    add column prop_instances jsonb,
    add column end_state text,
    add column dialogues jsonb,
    add column camera_description text,
    add column audio_description text,
    add column continuity_locks jsonb,
    add constraint ck_shot_scene_index
        check (scene_index is null or scene_index >= 1);

create index idx_shot_episode_scene_order
    on shot (episode_id, scene_index, order_index);
