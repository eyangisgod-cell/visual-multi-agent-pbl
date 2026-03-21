# Phase 0: 开发环境搭建实施计划（修订版）

> **版本**: 1.1 (Revised)
> **修订日期**: 2026-03-21
> **变更说明**: 根据审查报告修正 blocking 问题和潜在问题

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 搭建完整的本地 Docker 开发环境，所有服务可通过 Docker Compose 一键启动。

**Architecture:** Docker Compose 编排 5 个服务：Next.js 前端、FastAPI 后端、PostgreSQL 数据库、Redis 缓存、MinIO 对象存储。

**Tech Stack:** Docker, Docker Compose, Next.js 14, FastAPI, PostgreSQL 16 + pgvector, Redis 7, MinIO

**前置条件:**
- Docker Desktop 已安装并运行
- Git 已安装
- 代码已克隆到本地

---

## Task 0.1: 创建项目基础结构

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/Dockerfile`
- Create: `apps/ai-service/requirements.txt`
- Create: `apps/ai-service/Dockerfile`
- Create: `docker/docker-compose.dev.yml`
- Create: `.env.example`
- Create: `.gitignore` ← **新增 (Blocking 修正)**
- Create: `docker/.gitignore` ← **新增**

- [ ] **Step 1: 创建根目录 .gitignore**

```gitignore
# 依赖
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
python-eggs/
*.pyc
__pycache__/
*.pyo
.Python

# 构建输出
.next/
out/
build/
dist/
*.egg-info/
.eggs/

# 环境
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Docker
docker-compose.override.yml
.docker/

# IDE
.idea/
.vscode/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# 日志
logs/
*.log

# 数据库 (本地开发)
*.db
*.sqlite3

# 测试
coverage/
.nyc_output/
```

- [ ] **Step 2: 创建 docker/.gitignore**

```gitignore
# Docker 数据卷
postgres_data/
redis_data/
minio_data/

# 临时文件
*.log
tmp/
```

- [ ] **Step 3: 创建前端 package.json（版本锁定修正）**

```json
{
  "name": "@pbl/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push"
  },
  "dependencies": {
    "next": "14.1.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "pixi.js": "8.1.0",
    "socket.io-client": "4.7.0",
    "zustand": "4.5.0",
    "next-auth": "4.24.0",
    "@prisma/client": "5.9.0",
    "zod": "3.22.4",
    "bcryptjs": "2.4.3",
    "jsonwebtoken": "9.0.2",
    "ioredis": "5.3.2",
    "framer-motion": "11.0.3",
    "@radix-ui/react-dialog": "1.0.5",
    "clsx": "2.1.0",
    "tailwind-merge": "2.2.0"
  },
  "devDependencies": {
    "@types/node": "20.11.5",
    "@types/react": "18.2.48",
    "@types/react-dom": "18.2.18",
    "@types/bcryptjs": "2.4.6",
    "@types/jsonwebtoken": "9.0.5",
    "typescript": "5.3.3",
    "eslint": "8.56.0",
    "eslint-config-next": "14.1.0",
    "prisma": "5.9.0",
    "tailwindcss": "3.4.1",
    "autoprefixer": "10.4.17",
    "postcss": "8.4.33",
    "next-pwa": "5.6.0",
    "jest": "29.7.0",
    "@testing-library/react": "14.1.2"
  }
}
```

- [ ] **Step 4: 创建前端 Dockerfile（修正 package-lock 语法）**

```dockerfile
# apps/web/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

- [ ] **Step 5: 创建后端 requirements.txt（版本锁定）**

```text
# apps/ai-service/requirements.txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6
pydantic==2.5.3
pydantic-settings==2.1.0
python-dotenv==1.0.0
asyncpg==0.29.0
sqlalchemy==2.0.25
alembic==1.13.1
redis==5.0.1
minio==7.2.3
langchain==0.1.0
langchain-community==0.0.10
llama-index==0.9.44
sentence-transformers==2.3.1
psycopg2-binary==2.9.9
aiohttp==3.9.1
websockets==12.0
litellm==1.28.0
bcrypt==4.1.2
python-jose[cryptography]==3.3.0
```

- [ ] **Step 6: 创建后端 Dockerfile**

```dockerfile
# apps/ai-service/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

- [ ] **Step 7: 创建 Docker Compose 配置（修正版本和健康检查）**

```yaml
# docker/docker-compose.dev.yml
version: '3.8'

services:
  web:
    build:
      context: ../apps/web
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - ../apps/web:/app
      - /app/node_modules
      - /app/.next
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/pbl_platform
      - REDIS_URL=redis://redis:6379
      - AI_SERVICE_URL=http://ai-service:8000
      - MINIO_ENDPOINT=minio:9000
      - MINIO_ACCESS_KEY=minioadmin
      - MINIO_SECRET_KEY=minioadmin123
      - NEXTAUTH_SECRET=dev-secret-change-in-prod
      - NEXTAUTH_URL=http://localhost:3000
      - JWT_SECRET=dev-jwt-secret
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      # 移除 ai-service 依赖，改为可选连接

  ai-service:
    build:
      context: ../apps/ai-service
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ../apps/ai-service:/app
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/pbl_platform
      - REDIS_URL=redis://redis:6379
      - MINIO_ENDPOINT=minio:9000
      - MINIO_ACCESS_KEY=minioadmin
      - MINIO_SECRET_KEY=minioadmin123
      - LLM_PROVIDER=mock
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/health"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  postgres:
    image: pgvector/pgvector:pg16-0.5.0  # 指定具体版本
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: pbl_platform
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d pbl_platform"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly no  # 开发环境禁用持久化加速启动
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:RELEASE.2024-01-01T16-36-33Z  # 指定具体版本
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

- [ ] **Step 8: 创建环境变量示例**

```bash
# .env.example

# ===== 数据库 =====
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pbl_platform

# ===== Redis =====
REDIS_URL=redis://localhost:6379

# ===== MinIO =====
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_SECURE=false

# ===== Next.js =====
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change-this-in-production

# ===== JWT =====
JWT_SECRET=change-this-in-production

# ===== AI 服务 =====
AI_SERVICE_URL=http://localhost:8000

# ===== LLM 配置 =====
LLM_PROVIDER=aliyun
LLM_API_KEY=your-api-key-here
LLM_MODEL=qwen-max

# ===== 微信登录（可选）=====
WECHAT_APP_ID=
WECHAT_APP_SECRET=
```

- [ ] **Step 9: 创建根目录 docker-compose.yml 快捷方式**

```yaml
# docker-compose.yml (根目录)
# 快捷方式，链接到 docker/docker-compose.dev.yml
# 使用方式：docker-compose up -d
#
# 完整配置请见 docker/docker-compose.dev.yml

include:
  - docker/docker-compose.dev.yml
```

- [ ] **Step 10: 验证 Docker Compose 配置语法**

```bash
cd docker
docker-compose -f docker-compose.dev.yml config
```

**Expected:** Valid YAML output with all services defined

- [ ] **Step 11: Commit**

```bash
git add .gitignore docker/.gitignore
git add apps/web/package.json apps/web/Dockerfile
git add apps/ai-service/requirements.txt apps/ai-service/Dockerfile
git add docker/docker-compose.dev.yml docker-compose.yml .env.example
git commit -m "feat(phase-0): setup Docker development environment

- Add Next.js frontend Docker configuration
- Add FastAPI backend Docker configuration with healthcheck
- Add Docker Compose with 5 services (fixed versions)
- Add environment variable templates
- Add .gitignore files (root + docker)
- Add root docker-compose.yml shortcut"
```

---

## Task 0.2: 创建数据库初始化脚本

**Files:**
- Create: `docker/init-db/001-extensions.sql`
- Create: `docker/init-db/002-users.sql`
- Create: `docker/init-db/003-agents.sql`
- Create: `docker/init-db/004-projects.sql`
- Create: `docker/init-db/005-seed.sql`

- [ ] **Step 1: 创建扩展和函数脚本**

```sql
-- docker/init-db/001-extensions.sql
-- Enable pgvector extension
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

COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function to update updated_at timestamp';
```

- [ ] **Step 2: 创建用户域表结构**

```sql
-- docker/init-db/002-users.sql

-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255),
    nickname VARCHAR(50),
    avatar_url TEXT,
    grade INTEGER CHECK (grade BETWEEN 1 AND 12),
    invitation_code VARCHAR(10) UNIQUE NOT NULL,
    invited_by UUID REFERENCES users(id),
    points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    abilities JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT chk_points_nonneg CHECK (points >= 0),
    CONSTRAINT chk_level_nonneg CHECK (level >= 1)
);

-- 会话表
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    device_info JSONB,
    ip_address INET,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_invitation_code ON users(invitation_code);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- 触发器
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

- [ ] **Step 3: 创建智能体表结构**

```sql
-- docker/init-db/003-agents.sql

-- 智能体定义表
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    agent_type VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    personality JSONB,
    skills JSONB,
    avatar_url TEXT,
    sprite_url TEXT,
    is_platform BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 用户智能体表
CREATE TABLE user_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id),
    custom_name VARCHAR(100),
    custom_config JSONB,
    short_term_memory JSONB,
    long_term_memory JSONB,
    trust_level INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, agent_id)
);

-- 索引
CREATE INDEX idx_agents_type ON agents(agent_type);
CREATE INDEX idx_user_agents_user_id ON user_agents(user_id);

-- 触发器
CREATE TRIGGER update_user_agents_updated_at
    BEFORE UPDATE ON user_agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

- [ ] **Step 4: 创建项目表结构**

```sql
-- docker/init-db/004-projects.sql

-- 项目表
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    grade_min INTEGER CHECK (grade_min BETWEEN 1 AND 12),
    grade_max INTEGER CHECK (grade_max BETWEEN 1 AND 12),
    subject VARCHAR(50),
    tags TEXT[],
    difficulty INTEGER DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
    estimated_minutes INTEGER,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_premium BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    completed_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_grade_range CHECK (grade_min <= grade_max)
);

-- 项目任务表
CREATE TABLE project_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    agent_type VARCHAR(50),
    expected_output TEXT,
    rubric JSONB,
    prerequisites UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(project_id, order_index),
    CONSTRAINT chk_order_positive CHECK (order_index >= 0)
);

-- 索引
CREATE INDEX idx_projects_grade ON projects(grade_min, grade_max);
CREATE INDEX idx_projects_subject ON projects(subject);
CREATE INDEX idx_project_tasks_project_id ON project_tasks(project_id);

-- 触发器
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

- [ ] **Step 5: 创建种子数据脚本**

```sql
-- docker/init-db/005-seed.sql

-- 插入平台预设智能体
INSERT INTO agents (name, agent_type, description, personality, skills, avatar_url, is_platform) VALUES
('智慧导师', 'mentor', '引导学生探索知识的 AI 导师',
 '{"traits": ["patient", "encouraging", "socratic"], "tone": "warm", "teaching_style": "inquiry_based"}',
 '{"capabilities": ["explain_concepts", "ask_guiding_questions", "break_down_tasks"]}',
 '/avatars/mentor.png', true),

('创意设计师', 'designer', '帮助学生进行创意设计和视觉创作',
 '{"traits": ["creative", "detail_oriented", "visual_thinker"], "tone": "enthusiastic", "style": "modern"}',
 '{"capabilities": ["visual_design", "3d_modeling", "color_theory", "layout"]}',
 '/avatars/designer.png', true),

('数据分析师', 'analyst', '协助学生分析数据和信息',
 '{"traits": ["analytical", "logical", "precise"], "tone": "professional", "approach": "data_driven"}',
 '{"capabilities": ["data_analysis", "chart_creation", "pattern_recognition"]}',
 '/avatars/analyst.png', true),

('运营推广师', 'marketer', '帮助学生推广和展示作品',
 '{"traits": ["communicative", "persuasive", "trend_aware"], "tone": "energetic", "focus": "audience"}',
 '{"capabilities": ["content_writing", "social_media", "presentation"]}',
 '/avatars/marketer.png', true),

('CEO 助手', 'assistant', '协助 CEO(学生) 协调各智能体工作',
 '{"traits": ["organized", "efficient", "proactive"], "tone": "professional", "role": "coordinator"}',
 '{"capabilities": ["task_coordination", "progress_tracking", "reminders"]}',
 '/avatars/assistant.png', true);
```

- [ ] **Step 6: Commit**

```bash
git add docker/init-db/
git commit -m "feat(phase-0): add database initialization scripts

- Add pgvector extension setup
- Add users, sessions tables
- Add agents, user_agents tables
- Add projects, project_tasks tables
- Add seed data for platform agents"
```

---

## Task 0.3: 创建 Next.js 前端脚手架

**Files:**
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/app/api/health/route.ts`
- Create: `apps/web/next.config.js`
- Create: `apps/web/tailwind.config.js`
- Create: `apps/web/postcss.config.js`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/prisma/schema.prisma`
- Create: `apps/web/jest.config.js`
- Create: `apps/web/.eslintrc.json`

- [ ] **Step 1: 创建 TypeScript 配置**

```json
// apps/web/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{"name": "next"}],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 2: 创建 Next.js 配置**

```javascript
// apps/web/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    AI_SERVICE_URL: process.env.AI_SERVICE_URL,
  },
}

module.exports = nextConfig
```

- [ ] **Step 3: 创建 Tailwind 配置**

```javascript
// apps/web/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        secondary: '#7C3AED',
        accent: '#F59E0B',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 4: 创建 PostCSS 配置**

```javascript
// apps/web/postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 5: 创建 ESLint 配置**

```json
// apps/web/.eslintrc.json
{
  "extends": ["next/core-web-vitals"]
}
```

- [ ] **Step 6: 创建 Jest 配置**

```javascript
// apps/web/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
}
```

- [ ] **Step 7: 创建 Prisma Schema**

```prisma
// apps/web/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(uuid()) @db.Uuid
  username      String?   @unique @db.VarChar(50)
  passwordHash  String?   @map("password_hash") @db.VarChar(255)
  nickname      String?   @db.VarChar(50)
  avatarUrl     String?   @map("avatar_url") @db.Text
  grade         Int?
  invitationCode String?  @unique @map("invitation_code") @db.VarChar(10)
  invitedBy     String?   @map("invited_by") @db.Uuid
  points        Int       @default(0)
  level         Int       @default(1)
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  sessions      Session[]
  userAgents    UserAgent[]
  works         Work[]

  @@map("users")
}

model Session {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  token     String   @unique @db.VarChar(255)
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model Agent {
  id           String   @id @default(uuid()) @db.Uuid
  name         String   @db.VarChar(100)
  agentType    String   @unique @map("agent_type") @db.VarChar(50)
  description  String?  @db.Text
  personality  Json?
  skills       Json?
  avatarUrl    String?  @map("avatar_url") @db.Text
  isPlatform   Boolean  @default(true) @map("is_platform")
  createdAt    DateTime @default(now()) @map("created_at")

  userAgents   UserAgent[]

  @@map("agents")
}

model UserAgent {
  id           String  @id @default(uuid()) @db.Uuid
  userId       String  @map("user_id") @db.Uuid
  agentId      String  @map("agent_id") @db.Uuid
  customName   String? @map("custom_name") @db.VarChar(100)
  customConfig Json?   @map("custom_config")
  createdAt    DateTime @default(now()) @map("created_at")

  user         User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  agent        Agent   @relation(fields: [agentId], references: [id])

  @@map("user_agents")
}

model Project {
  id              String   @id @default(uuid()) @db.Uuid
  title           String   @db.VarChar(255)
  description     String?  @db.Text
  gradeMin        Int?     @map("grade_min")
  gradeMax        Int?     @map("grade_max")
  subject         String?  @db.VarChar(50)
  difficulty      Int      @default(1)
  status          String   @default("draft")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  tasks           ProjectTask[]
  works           Work[]

  @@map("projects")
}

model ProjectTask {
  id             String  @id @default(uuid()) @db.Uuid
  projectId      String  @map("project_id") @db.Uuid
  title          String  @db.VarChar(255)
  orderIndex     Int     @map("order_index")
  agentType      String? @map("agent_type") @db.VarChar(50)
  createdAt      DateTime @default(now()) @map("created_at")

  project        Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@map("project_tasks")
}

model Work {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  projectId   String?  @map("project_id") @db.Uuid
  title       String   @db.VarChar(255)
  description String?  @db.Text
  status      String   @default("pending_review")
  createdAt   DateTime @default(now()) @map("created_at")

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  project     Project? @relation(fields: [projectId], references: [id])

  @@map("works")
}
```

- [ ] **Step 8: 创建基础布局组件**

```tsx
// apps/web/src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '可视项目式学习平台',
  description: 'K12 学生多智能体游戏化学习平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 9: 创建全局样式**

```css
/* apps/web/src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

body {
  color: rgb(var(--foreground-rgb));
}
```

- [ ] **Step 10: 创建首页**

```tsx
// apps/web/src/app/page.tsx
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold text-primary mb-4">
        可视项目式学习平台
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        扮演 CEO，调度智能体，完成项目挑战！
      </p>
      <div className="flex gap-4">
        <a
          href="/auth/login"
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-indigo-700"
        >
          开始学习
        </a>
        <button className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
          查看作品
        </button>
      </div>
    </main>
  )
}
```

- [ ] **Step 11: 创建健康检查 API**

```typescript
// apps/web/src/app/api/health/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'visual-pbl-web'
  })
}
```

- [ ] **Step 12: Commit**

```bash
git add apps/web/src apps/web/*.config.js apps/web/tsconfig.json
git add apps/web/prisma apps/web/jest.config.js apps/web/.eslintrc.json
git commit -m "feat(phase-0): setup Next.js frontend scaffold

- Add Next.js 14 with App Router
- Add TypeScript configuration
- Add Tailwind CSS + PostCSS
- Add Prisma ORM setup
- Add Jest + ESLint configuration
- Add basic layout and home page"
```

---

## Task 0.4: 创建 FastAPI 后端脚手架

**Files:**
- Create: `apps/ai-service/app/main.py`
- Create: `apps/ai-service/app/config.py`
- Create: `apps/ai-service/app/api/health.py`
- Create: `apps/ai-service/app/models/__init__.py`
- Create: `apps/ai-service/app/db/__init__.py`
- Create: `apps/ai-service/alembic.ini`
- Create: `apps/ai-service/.gitignore`

- [ ] **Step 1: 创建配置模块**

```python
# apps/ai-service/app/config.py
from pydantic_settings import BaseSettings
from typing import Optional, List

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/pbl_platform"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # MinIO
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin123"
    MINIO_SECURE: bool = False

    # LLM
    LLM_PROVIDER: str = "mock"
    LLM_API_KEY: Optional[str] = None
    LLM_MODEL: str = "qwen-max"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"

settings = Settings()
```

- [ ] **Step 2: 创建数据库连接模块**

```python
# apps/ai-service/app/db/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

- [ ] **Step 3: 创建 FastAPI 主应用**

```python
# apps/ai-service/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import health

app = FastAPI(
    title="Visual PBL AI Service",
    description="AI service for Visual PBL Platform",
    version="0.1.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["health"])

@app.get("/")
async def root():
    return {"message": "Visual PBL AI Service", "version": "0.1.0"}
```

- [ ] **Step 4: 创建健康检查 API**

```python
# apps/ai-service/app/api/health.py
from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

@router.get("/health")
async def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "visual-pbl-ai-service"
    }
```

- [ ] **Step 5: 创建模块初始化文件**

```python
# apps/ai-service/app/__init__.py
"""Visual PBL AI Service"""

# apps/ai-service/app/api/__init__.py
from .health import router

__all__ = ["router"]

# apps/ai-service/app/models/__init__.py
"""SQLAlchemy models"""

# apps/ai-service/app/db/__init__.py
"""Database connection"""
from .database import Base, get_db, engine

__all__ = ["Base", "get_db", "engine"]
```

- [ ] **Step 6: 创建 Python .gitignore**

```gitignore
# apps/ai-service/.gitignore
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
.venv
venv/
ENV/
.pytest_cache/
.coverage
htmlcov/
```

- [ ] **Step 7: 验证服务启动**

```bash
cd apps/ai-service
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected:** Server running at http://0.0.0.0:8000

- [ ] **Step 8: Commit**

```bash
git add apps/ai-service/app/ apps/ai-service/.gitignore
git commit -m "feat(phase-0): setup FastAPI backend scaffold

- Add FastAPI application with CORS
- Add configuration management
- Add database connection (async SQLAlchemy)
- Add health check endpoint
- Add Python .gitignore"
```

---

## Task 0.5: 启动并验证开发环境

**Files:**
- Modify: (none - using existing files)

- [ ] **Step 1: 复制环境变量文件**

```bash
cp .env.example .env
```

- [ ] **Step 2: 启动所有服务**

```bash
cd docker
docker-compose -f docker-compose.dev.yml up -d
```

**Expected:** All 5 services start successfully

- [ ] **Step 3: 查看服务状态**

```bash
cd docker
docker-compose -f docker-compose.dev.yml ps
```

**Expected:** All services show "Up" status

- [ ] **Step 4: 等待服务健康检查**

```bash
# 等待 30 秒让服务启动
sleep 30

# 查看所有服务健康状态
docker-compose -f docker-compose.dev.yml ps
```

**Expected:** All services show "healthy" status

- [ ] **Step 5: 验证 PostgreSQL 启动**

```bash
docker-compose -f docker-compose.dev.yml logs postgres | grep "database system is ready"
```

**Expected:** Log shows "database system is ready"

- [ ] **Step 6: 验证 Redis 启动**

```bash
docker-compose -f docker-compose.dev.yml exec redis redis-cli ping
```

**Expected:** PONG

- [ ] **Step 7: 验证 MinIO 启动**

```bash
curl -f http://localhost:9000/minio/health/live
```

**Expected:** HTTP 200 OK

- [ ] **Step 8: 验证 Next.js 启动**

```bash
curl -f http://localhost:3000/api/health
```

**Expected:** `{"status":"ok","service":"visual-pbl-web"}`

- [ ] **Step 9: 验证 FastAPI 启动**

```bash
curl -f http://localhost:8000/api/health
```

**Expected:** `{"status":"ok","service":"visual-pbl-ai-service"}`

- [ ] **Step 10: 验证数据库表创建**

```bash
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d pbl_platform -c "\dt"
```

**Expected:** List of tables: users, sessions, agents, user_agents, projects, project_tasks

- [ ] **Step 11: 验证种子数据**

```bash
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d pbl_platform -c "SELECT agent_type, name FROM agents;"
```

**Expected:** 5 个智能体记录 (mentor, designer, analyst, marketer, assistant)

- [ ] **Step 12: Commit**

```bash
git commit --allow-empty -m "chore(phase-0): verify development environment complete

All services running and healthy:
- Next.js frontend on port 3000
- FastAPI backend on port 8000 (with healthcheck)
- PostgreSQL 16 + pgvector 0.5.0 on port 5432
- Redis 7 on port 6379
- MinIO on ports 9000/9001

Database tables created:
- users, sessions
- agents, user_agents
- projects, project_tasks

Seed data loaded:
- 5 platform agents"
```

---

## Phase 0 完成检查清单

- [ ] Docker Compose 配置正确（所有服务有健康检查）
- [ ] 所有服务正常启动并健康
- [ ] 数据库表结构创建成功
- [ ] 种子数据加载成功
- [ ] 前端可访问 http://localhost:3000
- [ ] 后端 API 可访问 http://localhost:8000
- [ ] 环境变量配置完整
- [ ] .gitignore 文件创建（根目录 + docker + ai-service）
- [ ] 所有验证步骤通过

---

## 修订说明（v1.1）

根据审查报告修正的问题：

### Blocking 问题修正
| 问题 | 修正 |
|------|------|
| 缺少 .gitignore | 新增 Task 0.1 Step 1-2 |
| ai-service 无健康检查 | Docker Compose 中添加 healthcheck |
| ai-service 依赖问题 | 移除 web 对 ai-service 的 depends_on |

### 潜在问题修正
| 问题 | 修正 |
|------|------|
| pgvector 版本不具体 | 指定 `pgvector:pg16-0.5.0` |
| Redis 持久化影响性能 | 改为 `--appendonly no` |
| MinIO 健康检查用 curl | 改为 `mc ready` |
| package-lock.json* 语法 | 移除通配符 |
| 版本未锁定 | 所有依赖使用精确版本 |

### 遗漏内容补充
| 遗漏 | 补充 |
|------|------|
| docker/.gitignore | 新增 |
| apps/ai-service/.gitignore | 新增 |
| 根目录 docker-compose.yml | 新增快捷方式 |
| Jest 配置 | 新增 |
| ESLint 配置 | 新增 |
| PostCSS 配置 | 新增 |

---

## 下一步

Phase 0 完成后，继续执行：

1. **审查 Phase 0 修订版计划** - 确保所有问题已修正
2. **开始执行 Phase 0** - 调用 `superpowers:subagent-driven-development`
3. **Phase 1** - 用户认证系统

---

**文档结束**
