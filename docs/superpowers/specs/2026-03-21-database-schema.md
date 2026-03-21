# 数据库架构设计文档

**版本**: 1.0
**日期**: 2026-03-21

---

## 一、数据库选型

| 组件 | 技术选型 | 用途 |
|------|----------|------|
| **关系型数据库** | PostgreSQL 16 | 核心业务数据 |
| **向量插件** | pgvector 0.7+ | RAG 知识向量检索 |
| **缓存** | Redis 7 | 会话、排行榜、实时状态 |
| **对象存储** | MinIO / 阿里云 OSS | 文件、图片、3D 模型 |

---

## 二、ER 图概览

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          数据库 ER 图                                    │
└─────────────────────────────────────────────────────────────────────────┘

users ──┬──< sessions
        ├──< user_agents
        ├──< works
        ├──< conversations
        ├──< comments
        ├──< work_likes
        └──< invited_users (self-referencing)

agents ──┬──< user_agents

projects ─┬──< project_tasks
          ├──< works
          └──< conversations

works ────┬──< work_likes
          └──< comments

knowledge_base (vector table for RAG)
```

---

## 三、完整表结构设计

### 3.1 用户域

#### users - 用户表

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 认证信息
    username VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255),

    -- 个人信息
    nickname VARCHAR(50),
    avatar_url TEXT,
    grade INTEGER CHECK (grade BETWEEN 1 AND 12),

    -- 邀请关系
    invitation_code VARCHAR(10) UNIQUE NOT NULL,
    invited_by UUID REFERENCES users(id),

    -- 游戏化数据
    points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    abilities JSONB DEFAULT '{}',  -- 能力雷达图数据

    -- 元数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,  -- 软删除

    -- 索引
    CONSTRAINT chk_points_nonneg CHECK (points >= 0),
    CONSTRAINT chk_level_nonneg CHECK (level >= 1)
);

-- 索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_invitation_code ON users(invitation_code);
CREATE INDEX idx_users_invited_by ON users(invited_by);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;
```

#### sessions - 会话表

```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    device_info JSONB,  -- 设备信息
    ip_address INET,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

---

### 3.2 智能体域

#### agents - 智能体定义表

```sql
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 基本信息
    name VARCHAR(100) NOT NULL,
    agent_type VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,

    -- 人格配置 (对应 OpenClaw soul.md)
    personality JSONB,  -- {traits: [], tone: "", background: ""}

    -- 技能配置
    skills JSONB,       -- {capabilities: [], tools: []}

    -- 形象
    avatar_url TEXT,
    sprite_url TEXT,    -- PixiJS 精灵图 URL

    -- 平台预设标志
    is_platform BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,

    -- 元数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_agents_type ON agents(agent_type);
CREATE INDEX idx_agents_platform ON agents(is_platform);
```

#### user_agents - 用户智能体表

```sql
CREATE TABLE user_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id),

    -- 自定义配置
    custom_name VARCHAR(100),
    custom_config JSONB,  -- 用户自定义的配置

    -- 记忆数据 (对应 OpenClaw memory.md)
    short_term_memory JSONB,  -- 短期记忆
    long_term_memory JSONB,   -- 长期记忆

    -- 关系数据
    trust_level INTEGER DEFAULT 0,  -- 信任度
    usage_count INTEGER DEFAULT 0,  -- 使用次数

    -- 元数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, agent_id)
);

-- 索引
CREATE INDEX idx_user_agents_user_id ON user_agents(user_id);
CREATE INDEX idx_user_agents_agent_id ON user_agents(agent_id);
```

---

### 3.3 项目域

#### projects - 项目表

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 基本信息
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image_url TEXT,

    -- 适用范围
    grade_min INTEGER CHECK (grade_min BETWEEN 1 AND 12),
    grade_max INTEGER CHECK (grade_max BETWEEN 1 AND 12),
    subject VARCHAR(50),  -- 数学、科学、历史等
    tags TEXT[],

    -- 难度和时长
    difficulty INTEGER DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
    estimated_minutes INTEGER,

    -- 状态
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_premium BOOLEAN DEFAULT false,  -- 是否付费项目

    -- 创建者
    created_by UUID REFERENCES users(id),

    -- 统计数据
    completed_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,

    -- 元数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_grade_range CHECK (grade_min <= grade_max)
);

-- 索引
CREATE INDEX idx_projects_grade ON projects(grade_min, grade_max);
CREATE INDEX idx_projects_subject ON projects(subject);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_premium ON projects(is_premium);
```

#### project_tasks - 项目任务表

```sql
CREATE TABLE project_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- 任务信息
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- 顺序和类型
    order_index INTEGER NOT NULL,
    agent_type VARCHAR(50),  -- 推荐智能体类型

    -- 任务配置
    expected_output TEXT,
    rubric JSONB,  -- 评分标准

    -- 前置条件
    prerequisites UUID[],  -- 前置任务 ID 列表

    -- 元数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(project_id, order_index),
    CONSTRAINT chk_order_positive CHECK (order_index >= 0)
);

-- 索引
CREATE INDEX idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX idx_project_tasks_order ON project_tasks(project_id, order_index);
```

---

### 3.4 作品域

#### works - 作品表

```sql
CREATE TABLE works (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 关联
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id),

    -- 作品信息
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- 内容
    content JSONB,      -- 结构化内容
    file_urls JSONB,    -- 文件 URL 列表

    -- 状态
    status VARCHAR(20) DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected', 'published')),

    -- 审核
    reviewed_by UUID REFERENCES users(id),  -- 审核员
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,

    -- 统计数据
    likes_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,

    -- 元数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_likes_nonneg CHECK (likes_count >= 0)
);

-- 索引
CREATE INDEX idx_works_user_id ON works(user_id);
CREATE INDEX idx_works_project_id ON works(project_id);
CREATE INDEX idx_works_status ON works(status);
CREATE INDEX idx_works_created_at ON works(created_at DESC);
```

#### work_likes - 作品点赞表

```sql
CREATE TABLE work_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(work_id, user_id)
);

-- 索引
CREATE INDEX idx_work_likes_work_id ON work_likes(work_id);
CREATE INDEX idx_work_likes_user_id ON work_likes(user_id);
```

#### comments - 评论表

```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id),

    -- 评论内容
    content TEXT NOT NULL,

    -- 状态
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'deleted')),

    -- 元数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_comment_not_empty CHECK (length(trim(content)) > 0)
);

-- 索引
CREATE INDEX idx_comments_work_id ON comments(work_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
```

---

### 3.5 对话域

#### agent_conversations - 智能体对话表

```sql
CREATE TABLE agent_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id),

    -- 会话数据
    session_id VARCHAR(100) UNIQUE,  -- AG2 session ID
    session_data JSONB,  -- 完整对话历史

    -- 当前状态
    current_task_id UUID REFERENCES project_tasks(id),
    active_agents UUID[],  -- 参与对话的智能体 ID

    -- 元数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_conversations_user_id ON agent_conversations(user_id);
CREATE INDEX idx_conversations_project_id ON agent_conversations(project_id);
CREATE INDEX idx_conversations_session_id ON agent_conversations(session_id);
```

#### conversation_messages - 对话消息表

```sql
CREATE TABLE conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES agent_conversations(id) ON DELETE CASCADE,

    -- 消息内容
    role VARCHAR(20) NOT NULL,  -- user, assistant, system
    agent_id UUID REFERENCES agents(id),
    content TEXT NOT NULL,

    -- 元数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    message_index INTEGER NOT NULL,

    UNIQUE(conversation_id, message_index)
);

-- 索引
CREATE INDEX idx_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX idx_messages_created_at ON conversation_messages(conversation_id, created_at);
```

---

### 3.6 RAG 知识域

#### knowledge_base - 知识库表（向量检索）

```sql
CREATE TABLE knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 基本信息
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,

    -- 分类
    subject VARCHAR(50),
    grade_min INTEGER,
    grade_max INTEGER,
    tags TEXT[],

    -- 向量 (使用 pgvector)
    embedding vector(1024),  -- BGE-M3 向量维度

    -- 来源
    source_type VARCHAR(20),  -- upload, auto_generated, manual
    source_id UUID,  -- 来源文档 ID

    -- 元数据
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_grade_range_kb CHECK (grade_min IS NULL OR grade_max IS NULL OR grade_min <= grade_max)
);

-- 向量索引 (IVFFlat for faster search)
CREATE INDEX knowledge_base_embedding_idx
ON knowledge_base
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 普通索引
CREATE INDEX idx_knowledge_subject ON knowledge_base(subject);
CREATE INDEX idx_knowledge_grade ON knowledge_base(grade_min, grade_max);
CREATE INDEX idx_knowledge_tags ON knowledge_base USING GIN (tags);
```

#### knowledge_chunks - 知识分块表

```sql
CREATE TABLE knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_id UUID NOT NULL REFERENCES knowledge_base(id) ON DELETE CASCADE,

    -- 分块内容
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1024),

    -- 位置信息
    start_offset INTEGER,
    end_offset INTEGER,

    UNIQUE(knowledge_id, chunk_index)
);

-- 向量索引
CREATE INDEX knowledge_chunks_embedding_idx
ON knowledge_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 50);
```

---

### 3.7 管理后台域

#### admin_users - 管理员表

```sql
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 认证
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    -- 角色
    role VARCHAR(20) NOT NULL DEFAULT 'editor' CHECK (role IN ('super_admin', 'admin', 'editor', 'reviewer')),

    -- 权限
    permissions JSONB DEFAULT '[]',

    -- 状态
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,

    -- 元数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES admin_users(id)
);

-- 索引
CREATE INDEX idx_admin_users_username ON admin_users(username);
CREATE INDEX idx_admin_users_role ON admin_users(role);
```

#### audit_logs - 审计日志表

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 操作信息
    admin_user_id UUID REFERENCES admin_users(id),
    action VARCHAR(50) NOT NULL,  -- CREATE, UPDATE, DELETE, APPROVE, REJECT
    entity_type VARCHAR(50) NOT NULL,  -- user, project, work, agent
    entity_id UUID NOT NULL,

    -- 变更详情
    old_value JSONB,
    new_value JSONB,

    -- 元数据
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

---

## 四、向量检索查询示例

### 4.1 语义搜索

```sql
-- 搜索与查询最相关的知识
SELECT
    id,
    title,
    content,
    subject,
    1 - (embedding <=> $query_embedding) AS similarity
FROM knowledge_base
WHERE grade_min <= $grade AND grade_max >= $grade
ORDER BY embedding <=> $query_embedding
LIMIT 5;
```

### 4.2 混合检索（向量 + 关键词）

```sql
-- 结合向量相似度和关键词匹配
WITH vector_search AS (
    SELECT id, 1 - (embedding <=> $query_embedding) AS vector_score
    FROM knowledge_base
    WHERE subject = $subject
    ORDER BY embedding <=> $query_embedding
    LIMIT 20
),
keyword_search AS (
    SELECT id, ts_rank(to_tsvector('simple', content), to_tsquery('simple', $keywords)) AS keyword_score
    FROM knowledge_base
    WHERE content ILIKE '%' || $keywords || '%'
    LIMIT 20
)
SELECT
    kb.id,
    kb.title,
    kb.content,
    COALESCE(vs.vector_score, 0) * 0.7 + COALESCE(ks.keyword_score, 0) * 0.3 AS combined_score
FROM knowledge_base kb
LEFT JOIN vector_search vs ON kb.id = vs.id
LEFT JOIN keyword_search ks ON kb.id = ks.id
WHERE vs.id IS NOT NULL OR ks.id IS NOT NULL
ORDER BY combined_score DESC
LIMIT 5;
```

---

## 五、Redis 数据结构设计

### 5.1 Session 缓存

```
Key: session:{token}
Value: JSON { user_id, expires_at }
TTL: 7 天
```

### 5.2 在线用户

```
Key: online:users
Type: Set
Members: [user_id, ...]
TTL: 5 分钟（心跳续期）
```

### 5.3 WebSocket 连接映射

```
Key: ws:user:{user_id}
Type: Hash
Fields: { connection_id, room_id, last_seen }
```

### 5.4 排行榜

```
Key: leaderboard:points
Type: Sorted Set
Members: { user_id: points }

Key: leaderboard:works
Type: Sorted Set
Members: { work_id: likes_count }
```

### 5.5 智能体响应缓存

```
Key: cache:agent:{agent_type}:{question_hash}
Value: JSON { response, created_at }
TTL: 24 小时
```

---

## 六、数据库初始化脚本

### 6.1 扩展和函数

```sql
-- 001-extensions.sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 更新更新时间函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 6.2 触发器

```sql
-- 002-triggers.sql
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_works_updated_at
    BEFORE UPDATE ON works
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_conversations_updated_at
    BEFORE UPDATE ON agent_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 七、数据迁移策略

### 7.1 使用 Alembic（Python 后端）

```bash
# 初始化
alembic init alembic

# 创建迁移
alembic revision --autogenerate -m "initial schema"

# 应用迁移
alembic upgrade head
```

### 7.2 使用 Prisma（Next.js 前端）

```bash
# 生成迁移
npx prisma migrate dev --name init

# 应用迁移
npx prisma migrate deploy
```

---

## 八、性能优化建议

1. **连接池**: PostgreSQL 设置 `max_connections = 100`, 使用 PgBouncer
2. **慢查询日志**: `log_min_duration_statement = 1000` (1 秒)
3. **定期 VACUUM**: 自动 VACUUM + 手动 VACUUM ANALYZE
4. **索引维护**: 定期 REINDEX
5. **分区表**: 审计日志按月份分区

---

**文档结束**
