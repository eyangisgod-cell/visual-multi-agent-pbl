-- 性能优化：数据库索引优化脚本
-- 创建时间：2026-04-12
-- 说明：为高频查询字段添加索引，优化查询性能

-- 用户表索引
-- 已存在：idx_users_invitation_code, idx_users_username
-- 新增：按角色查询、按积分排名查询
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- 会话表索引
-- 已存在：idx_sessions_expires_at, idx_sessions_token
-- 新增：按用户 ID 查询
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- 项目表索引
-- 已存在：idx_projects_grade, idx_projects_subject
-- 新增：按状态、创建者、热门度查询
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_like_count ON projects(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);

-- 项目任务表索引
-- 已存在：idx_project_tasks_project_id, idx_project_tasks_assigned_to
-- 新增：按状态、到期日查询
CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON project_tasks(status);
CREATE INDEX IF NOT EXISTS idx_project_tasks_due_date ON project_tasks(due_date);

-- 作品表索引
-- 已存在：idx_works_project_id, idx_works_user_id, idx_works_status
-- 新增：按分数、创建时间、热门度查询
CREATE INDEX IF NOT EXISTS idx_works_score ON works(score DESC);
CREATE INDEX IF NOT EXISTS idx_works_created_at ON works(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_works_premium ON works(is_premium) WHERE is_premium = true;

-- 作品评论表索引
-- 已存在：idx_work_comments_work_id
-- 新增：按用户 ID、父评论 ID 查询
CREATE INDEX IF NOT EXISTS idx_work_comments_user_id ON work_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_work_comments_parent_id ON work_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_work_comments_created_at ON work_comments(created_at DESC);

-- 作品点赞表索引
-- 已存在：idx_work_likes_work_id
-- 新增：按用户 ID 查询
CREATE INDEX IF NOT EXISTS idx_work_likes_user_id ON work_likes(user_id);

-- 作品评价表索引
-- 已存在：idx_work_reviews_work_id, idx_work_reviews_user_id
-- 新增：按评分、创建时间查询
CREATE INDEX IF NOT EXISTS idx_work_reviews_rating ON work_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_work_reviews_created_at ON work_reviews(created_at DESC);

-- 智能体表索引
CREATE INDEX IF NOT EXISTS idx_agents_agent_type ON agents(agent_type);
CREATE INDEX IF NOT EXISTS idx_agents_active ON agents(is_active) WHERE is_active = true;

-- 用户智能体表索引
-- 已存在：idx_user_agents_user_id
-- 新增：按智能体 ID 查询
CREATE INDEX IF NOT EXISTS idx_user_agents_agent_id ON user_agents(agent_id);

-- 智能体记忆表索引
-- 已存在：idx_agent_memories_agent_id, idx_agent_memories_user_id, idx_agent_memories_type, idx_agent_memories_consolidated
-- 新增：按重要性、创建时间查询
CREATE INDEX IF NOT EXISTS idx_agent_memories_importance ON agent_memories(importance DESC);
CREATE INDEX IF NOT EXISTS idx_agent_memories_created_at ON agent_memories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_memories_expires_at ON agent_memories(expires_at) WHERE expires_at IS NOT NULL;

-- 对话表索引
-- 已存在：idx_conversations_user_id, idx_conversations_agent_id
-- 新增：按更新时间查询
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- 消息表索引
-- 已存在：idx_messages_conversation_id, idx_messages_created_at
-- 新增：按角色过滤查询
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);

-- 知识库文档表索引
-- 已存在：idx_knowledge_documents_category, idx_knowledge_documents_created_at
-- 新增：全文搜索索引（PostgreSQL 全文搜索）
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_title_trgm ON knowledge_documents USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_content_trgm ON knowledge_documents USING gin (content gin_trgm_ops);

-- 管理员角色表索引
-- 已存在：idx_admin_roles_name
-- 新增：按内置状态查询
CREATE INDEX IF NOT EXISTS idx_admin_roles_built_in ON admin_roles(is_built_in);

-- 审计日志表索引
-- 已存在：idx_audit_logs_action, idx_audit_logs_entity_type, idx_audit_logs_entity_id, idx_audit_logs_user_id, idx_audit_logs_created_at
-- 新增：复合索引（常用查询组合）
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_action ON audit_logs(entity_type, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC);

-- 安全日志表索引
-- 已存在：idx_security_logs_event_type, idx_security_logs_severity, idx_security_logs_ip_address, idx_security_logs_user_id, idx_security_logs_created_at
-- 新增：复合索引
CREATE INDEX IF NOT EXISTS idx_security_logs_event_created ON security_logs(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity_created ON security_logs(severity, created_at DESC);

-- 性能分析：查看索引使用情况
-- SELECT schemaname, tablename, indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;

-- 性能分析：查看表大小和索引大小
-- SELECT
--   relname AS table_name,
--   pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
--   pg_size_pretty(pg_relation_size(relid)) AS table_size,
--   pg_size_pretty(pg_indexes_size(relid)) AS index_size
-- FROM pg_stat_user_tables
-- ORDER BY pg_total_relation_size(relid) DESC;
