-- 基线迁移：初始化数据库扩展，为业务表使用 UUID 主键做准备。
-- 说明：各业务表（project / episode / source_material / script / shot / asset /
-- panel / timeline / export / generation_task）的建表脚本，将在对应内容模块的
-- 独立 Issue/PR 中以 V2、V3 … 递增补充。本迁移仅打通 Flyway 与 PostgreSQL 的链路。
create extension if not exists "pgcrypto";
