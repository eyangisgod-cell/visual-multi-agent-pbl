# Visual PBL Platform MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建可视项目式学习平台 MVP，包含本地 Docker 开发环境、基础用户体系、像素风游戏界面、预设智能体协作、3 个示例项目任务。

**Architecture:** 混合架构 - Next.js 14 全栈（前端 + API 层）+ Python FastAPI 微服务（AG2 智能体 + RAG），Docker Compose 本地部署，PostgreSQL + pgvector 向量检索，Redis 缓存，MinIO 对象存储。

**Tech Stack:** Next.js 14, PixiJS 8, TypeScript, FastAPI, AG2, PostgreSQL 16 + pgvector, Redis 7, MinIO, Socket.IO

**关联文档:**
- 系统设计：`docs/superpowers/2026-03-21-visual-pbl-platform-design.md`
- 技术架构：`docs/superpowers/2026-03-21-technical-architecture.md`
- 设计决策：`docs/superpowers/2026-03-21-architecture-decisions.md`

---

## 文件结构概览

```
visual-multi-agent-pbl/
├── frontend/                 # Next.js 全栈应用
│   ├── src/
│   │   ├── app/             # Next.js App Router
│   │   │   ├── api/         # API Routes
│   │   │   ├── game/        # 游戏页面
│   │   │   └── page.tsx     # 首页
│   │   ├── components/
│   │   │   ├── pixi/        # PixiJS 渲染组件
│   │   │   └── ui/          # UI 组件
│   │   ├── lib/
│   │   │   ├── websocket.ts # WebSocket 客户端
│   │   │   └── api.ts       # API 客户端
│   │   └── store/
│   │       └── gameStore.ts # Zustand 状态管理
│   ├── Dockerfile
│   └── package.json
│
├── backend/
│   └── ai-service/          # Python AI 微服务
│       ├── app/
│       │   ├── api/         # FastAPI 路由
│       │   ├── agents/      # AG2 智能体定义
│       │   ├── rag/         # RAG 检索
│       │   └── models/      # Pydantic 模型
│       ├── Dockerfile
│       └── requirements.txt
│
├── docker/
│   ├── docker-compose.dev.yml
│   └── init-db/
│       └── 001-init.sql
│
└── docs/
    └── superpowers/
        ├── plans/           # 本计划所在目录
        └── specs/           # 设计文档
```

---

## 计划分解

本 MVP 计划分为 6 个独立的开发阶段，每个阶段产出的软件可独立运行和测试：

| 阶段 | 名称 | 说明 | 预计时间 |
|------|------|------|----------|
| **Phase 0** | 开发环境搭建 | Docker Compose + 基础配置 | 2 小时 |
| **Phase 1** | 用户认证系统 | 注册/登录/会话管理 | 4 小时 |
| **Phase 2** | PixiJS 游戏场景 | 像素风场景渲染 | 6 小时 |
| **Phase 3** | 智能体渲染系统 | 智能体移动 + 气泡对话 | 6 小时 |
| **Phase 4** | AG2 智能体服务 | 多智能体协作后端 | 8 小时 |
| **Phase 5** | 项目任务系统 | 3 个示例项目 + 流程 | 6 小时 |
| **Phase 6** | 集成测试 + 优化 | 端到端测试 + 性能优化 | 4 小时 |

---

## Phase 0: 开发环境搭建

**目标:** 搭建完整的本地开发环境，所有服务可通过 Docker Compose 一键启动。

### Task 0.1: 创建项目基础结构

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/Dockerfile`
- Create: `backend/ai-service/requirements.txt`
- Create: `backend/ai-service/Dockerfile`
- Create: `docker/docker-compose.dev.yml`

- [ ] **Step 1: 创建前端 package.json**

```json
{
  "name": "visual-pbl-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "pixi.js": "^8.1.0",
    "socket.io-client": "^4.7.0",
    "zustand": "^4.5.0",
    "next-auth": "^4.24.0",
    "prisma": "^5.9.0",
    "@prisma/client": "^5.9.0",
    "zod": "^3.22.0",
    "ioredis": "^5.3.0",
    "framer-motion": "^11.0.0",
    "tailwindcss": "^3.4.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.3.0",
    "eslint": "^8.56.0",
    "eslint-config-next": "14.1.0",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33",
    "next-pwa": "^5.6.0"
  }
}
```

- [ ] **Step 2: 创建前端 Dockerfile**

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

- [ ] **Step 3: 创建后端 requirements.txt**

```text
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
pgvector==0.2.4
psycopg2-binary==2.9.9
aiohttp==3.9.1
websockets==12.0
ag2==0.1.0
litellm==1.28.0
```

- [ ] **Step 4: 创建后端 Dockerfile**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

- [ ] **Step 5: 创建 Docker Compose 配置**

```yaml
version: '3.8'

services:
  nextjs-app:
    build:
      context: ../frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - ../frontend:/app
      - /app/node_modules
      - /app/.next
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/pbl_platform
      - REDIS_URL=redis://redis:6379
      - AI_SERVICE_URL=http://python-ai:8000
      - MINIO_ENDPOINT=minio:9000
      - MINIO_ACCESS_KEY=minioadmin
      - MINIO_SECRET_KEY=minioadmin123
      - NEXTAUTH_SECRET=dev-secret-change-in-prod
      - NEXTAUTH_URL=http://localhost:3000
    depends_on:
      - postgres
      - redis
      - python-ai

  python-ai:
    build:
      context: ../backend/ai-service
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ../backend/ai-service:/app
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/pbl_platform
      - REDIS_URL=redis://redis:6379
      - MINIO_ENDPOINT=minio:9000
      - MINIO_ACCESS_KEY=minioadmin
      - MINIO_SECRET_KEY=minioadmin123
      - LLM_PROVIDER=mock
    depends_on:
      - postgres
      - redis

  postgres:
    image: pgvector/pgvector:pg16
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
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
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
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

- [ ] **Step 6: 验证 Docker Compose 配置语法**

```bash
cd docker
docker-compose -f docker-compose.dev.yml config
```

Expected: Valid YAML output with all services

- [ ] **Step 7: Commit**

```bash
git add frontend/package.json frontend/Dockerfile
git add backend/ai-service/requirements.txt backend/ai-service/Dockerfile
git add docker/docker-compose.dev.yml
git commit -m "feat: setup Phase 0 Docker development environment"
```

---

### Task 0.2: 创建数据库初始化脚本

**Files:**
- Create: `docker/init-db/001-init.sql`
- Create: `docker/init-db/002-seed.sql`

- [ ] **Step 1: 创建数据库初始化脚本**

```sql
-- 001-init.sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255),
    nickname VARCHAR(50),
    avatar_url TEXT,
    grade INTEGER,
    invitation_code VARCHAR(10) UNIQUE,
    invited_by UUID REFERENCES users(id),
    points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    grade_min INTEGER,
    grade_max INTEGER,
    subject VARCHAR(50),
    difficulty INTEGER DEFAULT 1,
    estimated_minutes INTEGER,
    status VARCHAR(20) DEFAULT 'draft',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Project tasks table
CREATE TABLE project_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    agent_type VARCHAR(50),
    expected_output TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Agent definitions table
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    agent_type VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    personality TEXT,
    skills JSONB,
    avatar_url TEXT,
    is_platform BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User agents table (user created/owned agents)
CREATE TABLE user_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id),
    custom_name VARCHAR(100),
    custom_config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Works (student creations) table
CREATE TABLE works (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content JSONB,
    file_urls JSONB,
    status VARCHAR(20) DEFAULT 'pending_review',
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Work likes table
CREATE TABLE work_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_id UUID REFERENCES works(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(work_id, user_id)
);

-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_id UUID REFERENCES works(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id),
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'published',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Agent conversations table (for tracking agent interactions)
CREATE TABLE agent_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id),
    session_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Knowledge base table (for RAG)
CREATE TABLE knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    subject VARCHAR(50),
    grade_min INTEGER,
    grade_max INTEGER,
    embedding vector(1024),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for vector similarity search
CREATE INDEX knowledge_base_embedding_idx ON knowledge_base USING ivfflat (embedding vector_cosine_ops);

-- Index for common queries
CREATE INDEX idx_projects_grade ON projects(grade_min, grade_max);
CREATE INDEX idx_projects_subject ON projects(subject);
CREATE INDEX idx_users_invitation_code ON users(invitation_code);
CREATE INDEX idx_works_status ON works(status);
CREATE INDEX idx_knowledge_base_subject ON knowledge_base(subject, grade_min, grade_max);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_works_updated_at BEFORE UPDATE ON works
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

- [ ] **Step 2: 创建种子数据脚本**

```sql
-- 002-seed.sql
-- Seed platform agents

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

-- Seed sample projects

INSERT INTO projects (title, description, grade_min, grade_max, subject, difficulty, estimated_minutes, status) VALUES
('几何体教具设计', '设计一个可视化的几何体教具，帮助初中生理解立体几何的表面积和体积计算', 7, 9, '数学', 2, 120, 'published'),
('环保方案设计', '分析校园垃圾分类现状，设计一个智能垃圾分类方案', 5, 8, '科学', 2, 90, 'published'),
('历史人物对话', '通过 AI 与历史人物"对话"，了解历史事件的背景和人物心理', 6, 9, '历史', 1, 60, 'published');

-- Seed project tasks for geometry project

INSERT INTO project_tasks (project_id, title, description, order_index, agent_type, expected_output) VALUES
((SELECT id FROM projects WHERE title = '几何体教具设计'),
 '需求分析', '与导师智能体讨论，了解几何体教具的设计目标和用户需求', 1, 'mentor',
 '需求文档，包含目标用户、功能列表、使用场景'),

((SELECT id FROM projects WHERE title = '几何体教具设计'),
 '几何知识学习', '学习立方体、圆柱体、圆锥体等几何体的表面积和体积公式', 2, 'mentor',
 '知识点总结，包含公式推导和示例'),

((SELECT id FROM projects WHERE title = '几何体教具设计'),
 '结构设计', '设计几何体的展开图和立体结构', 3, 'designer',
 '设计草图或 3D 模型文件'),

((SELECT id FROM projects WHERE title = '几何体教具设计'),
 '可视化实现', '使用工具实现几何体的可视化展示', 4, 'designer',
 '可交互的 3D 模型或动画'),

((SELECT id FROM projects WHERE title = '几何体教具设计'),
 '作品展示', '准备作品介绍和展示材料', 5, 'marketer',
 '作品展示页面或演示文稿');

-- Seed invitation codes for testing
INSERT INTO users (nickname, invitation_code, points, level) VALUES
('测试用户 1', 'INV001', 100, 2),
('测试用户 2', 'INV002', 50, 1);
```

- [ ] **Step 3: Commit**

```bash
git add docker/init-db/
git commit -m "feat: add database initialization and seed scripts"
```

---

### Task 0.3: 创建 Next.js 项目脚手架

**Files:**
- Create: `frontend/src/app/layout.tsx`
- Create: `frontend/src/app/page.tsx`
- Create: `frontend/src/app/api/health/route.ts`
- Create: `frontend/next.config.js`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/tsconfig.json`

- [ ] **Step 1: 创建 Next.js 配置文件**

```json
// tsconfig.json
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

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    AI_SERVICE_URL: process.env.AI_SERVICE_URL,
    REDIS_URL: process.env.REDIS_URL,
  },
}

module.exports = nextConfig
```

```javascript
// tailwind.config.js
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

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 2: 创建基础布局组件**

```tsx
// src/app/layout.tsx
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

```css
/* src/app/globals.css */
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
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}
```

- [ ] **Step 3: 创建首页**

```tsx
// src/app/page.tsx
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
        <button className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-indigo-700">
          开始学习
        </button>
        <button className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
          查看作品
        </button>
      </div>
    </main>
  )
}
```

- [ ] **Step 4: 创建健康检查 API**

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'visual-pbl-frontend'
  })
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/ frontend/*.config.js frontend/tsconfig.json
git commit -m "feat: setup Next.js 14 project scaffold"
```

---

### Task 0.4: 创建 FastAPI 后端脚手架

**Files:**
- Create: `backend/ai-service/app/main.py`
- Create: `backend/ai-service/app/api/__init__.py`
- Create: `backend/ai-service/app/api/health.py`
- Create: `backend/ai-service/app/config.py`
- Create: `backend/ai-service/app/models/__init__.py`

- [ ] **Step 1: 创建配置模块**

```python
# backend/ai-service/app/config.py
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/pbl_platform"
    REDIS_URL: str = "redis://localhost:6379"
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin123"
    MINIO_SECURE: bool = False
    LLM_PROVIDER: str = "mock"
    LLM_API_KEY: Optional[str] = None
    LLM_MODEL: str = "qwen-max"

    class Config:
        env_file = ".env"

settings = Settings()
```

- [ ] **Step 2: 创建 FastAPI 主应用**

```python
# backend/ai-service/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import health

app = FastAPI(
    title="Visual PBL AI Service",
    description="AI service for Visual PBL Platform",
    version="0.1.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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

- [ ] **Step 3: 创建健康检查 API**

```python
# backend/ai-service/app/api/health.py
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

- [ ] **Step 4: 创建模块初始化文件**

```python
# backend/ai-service/app/api/__init__.py
from .health import router

__all__ = ["router"]
```

```python
# backend/ai-service/app/models/__init__.py
# Models will be added in subsequent phases
```

- [ ] **Step 5: 验证服务启动**

```bash
cd backend/ai-service
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Expected: Server running at http://0.0.0.0:8000

- [ ] **Step 6: Commit**

```bash
git add backend/ai-service/app/
git commit -m "feat: setup FastAPI backend scaffold"
```

---

### Task 0.5: 启动并验证开发环境

**Files:**
- Modify: `docker/docker-compose.dev.yml` (already created)

- [ ] **Step 1: 启动所有服务**

```bash
cd docker
docker-compose -f docker-compose.dev.yml up -d
```

Expected: All 5 services start successfully

- [ ] **Step 2: 验证 PostgreSQL 启动**

```bash
docker-compose -f docker-compose.dev.yml ps postgres
docker-compose -f docker-compose.dev.yml logs postgres | grep "database system is ready"
```

Expected: postgres status = Up, logs show "database system is ready"

- [ ] **Step 3: 验证 Redis 启动**

```bash
docker-compose -f docker-compose.dev.yml ps redis
docker-compose -f docker-compose.dev.yml exec redis redis-cli ping
```

Expected: redis status = Up, PONG response

- [ ] **Step 4: 验证 MinIO 启动**

```bash
curl -f http://localhost:9000/minio/health/live
```

Expected: HTTP 200 OK

- [ ] **Step 5: 验证 Next.js 启动**

```bash
curl -f http://localhost:3000/api/health
```

Expected: JSON response with status: ok

- [ ] **Step 6: 验证 FastAPI 启动**

```bash
curl -f http://localhost:8000/api/health
```

Expected: JSON response with status: ok

- [ ] **Step 7: Commit**

```bash
git commit --allow-empty -m "chore: verify Phase 0 development environment complete"
```

---

## Phase 1: 用户认证系统

**目标:** 实现用户注册、登录（用户名/密码 + 邀请码）、会话管理功能。

### Task 1.1: 实现数据库连接和 Prisma Schema

**Files:**
- Create: `frontend/prisma/schema.prisma`
- Create: `frontend/src/lib/prisma.ts`
- Create: `backend/ai-service/app/db/database.py`
- Create: `backend/ai-service/app/models/user.py`

- [ ] **Step 1: 创建 Prisma Schema**

```prisma
// frontend/prisma/schema.prisma
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

  invitedUsers  User[]    @relation("InvitedUsers")
  invitingUser  User?     @relation("InvitedUsers", fields: [invitedBy], references: [id])
  sessions      Session[]
  works         Work[]
  userAgents    UserAgent[]
  conversations AgentConversation[]
  comments      Comment[]
  workLikes     WorkLike[]

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
  estimatedMinutes Int?    @map("estimated_minutes")
  status          String   @default("draft") @db.VarChar(20)
  createdBy       String?  @map("created_by") @db.Uuid
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  tasks           ProjectTask[]
  works           Work[]
  conversations   AgentConversation[]

  @@map("projects")
}

model ProjectTask {
  id             String  @id @default(uuid()) @db.Uuid
  projectId      String  @map("project_id") @db.Uuid
  title          String  @db.VarChar(255)
  description    String? @db.Text
  orderIndex     Int     @map("order_index")
  agentType      String? @map("agent_type") @db.VarChar(50)
  expectedOutput String? @map("expected_output") @db.Text
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
  content     Json?
  fileUrls    Json?    @map("file_urls")
  status      String   @default("pending_review") @db.VarChar(20)
  likesCount  Int      @default(0) @map("likes_count")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  project     Project? @relation(fields: [projectId], references: [id])
  likes       WorkLike[]
  comments    Comment[]

  @@map("works")
}

model WorkLike {
  id        String  @id @default(uuid()) @db.Uuid
  workId    String  @map("work_id") @db.Uuid
  userId    String  @map("user_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")

  work      Work    @relation(fields: [workId], references: [id], onDelete: Cascade)
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([workId, userId])

  @@map("work_likes")
}

model Comment {
  id        String   @id @default(uuid()) @db.Uuid
  workId    String   @map("work_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  parentId  String?  @map("parent_id") @db.Uuid
  content   String   @db.Text
  status    String   @default("published") @db.VarChar(20)
  createdAt DateTime @default(now()) @map("created_at")

  work      Work     @relation(fields: [workId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent    Comment? @relation("CommentReplies", fields: [parentId], references: [id])
  replies   Comment[] @relation("CommentReplies")

  @@map("comments")
}

model AgentConversation {
  id         String   @id @default(uuid()) @db.Uuid
  userId     String   @map("user_id") @db.Uuid
  projectId  String?  @map("project_id") @db.Uuid
  sessionData Json?   @map("session_data")
  createdAt  DateTime @default(now()) @map("created_at")

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  project    Project? @relation(fields: [projectId], references: [id])

  @@map("agent_conversations")
}

model KnowledgeBase {
  id        String   @id @default(uuid()) @db.Uuid
  title     String   @db.VarChar(255)
  content   String   @db.Text
  subject   String?  @db.VarChar(50)
  gradeMin  Int?     @map("grade_min")
  gradeMax  Int?     @map("grade_max")
  embedding Unsupported("vector")? @db.Vector(1024)
  metadata  Json?
  createdAt DateTime @default(now()) @map("created_at")

  @@map("knowledge_base")
}
```

- [ ] **Step 2: 创建 Prisma 客户端**

```typescript
// frontend/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 3: 创建 Python 数据库连接**

```python
# backend/ai-service/app/db/database.py
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

- [ ] **Step 4: 创建 SQLAlchemy User 模型**

```python
# backend/ai-service/app/models/user.py
from sqlalchemy import Column, String, Integer, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.database import Base
import uuid

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=True)
    password_hash = Column(String(255), nullable=True)
    nickname = Column(String(50), nullable=True)
    avatar_url = Column(String, nullable=True)
    grade = Column(Integer, nullable=True)
    invitation_code = Column(String(10), unique=True, nullable=True)
    invited_by = Column(UUID(as_uuid=True), nullable=True)
    points = Column(Integer, default=0)
    level = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

- [ ] **Step 5: Run Prisma migration**

```bash
cd frontend
npx prisma migrate dev --name init
```

Expected: Migration created and applied successfully

- [ ] **Step 6: Commit**

```bash
git add frontend/prisma frontend/src/lib/prisma.ts
git add backend/ai-service/app/db backend/ai-service/app/models
git commit -m "feat: setup database schemas and connections"
```

---

（由于篇幅限制，这里只展示了 Phase 0 和 Phase 1 的部分任务。完整计划应包含所有 6 个 phases 的详细任务。）

---

## Phase 2-6 任务概览

### Phase 2: PixiJS 游戏场景

| Task | 说明 | 文件 |
|------|------|------|
| 2.1 | PixiJS 应用初始化 | `src/components/pixi/GameCanvas.tsx` |
| 2.2 | 场景图层管理 | `src/components/pixi/layers/` |
| 2.3 | 像素风地图渲染 | `src/components/pixi/MapRenderer.tsx` |
| 2.4 | 摄像机控制 | `src/components/pixi/Camera.ts` |
| 2.5 | 移动端触摸控制 | `src/components/pixi/TouchControls.ts` |

### Phase 3: 智能体渲染系统

| Task | 说明 | 文件 |
|------|------|------|
| 3.1 | 智能体精灵渲染 | `src/components/pixi/AgentSprite.ts` |
| 3.2 | 移动动画系统 | `src/components/pixi/MovementSystem.ts` |
| 3.3 | 对话气泡渲染 | `src/components/pixi/SpeechBubble.ts` |
| 3.4 | 表情状态系统 | `src/components/pixi/ExpressionSystem.ts` |
| 3.5 | 智能体状态同步 | `src/lib/websocket.ts` |

### Phase 4: AG2 智能体服务

| Task | 说明 | 文件 |
|------|------|------|
| 4.1 | AG2 智能体定义 | `backend/ai-service/app/agents/` |
| 4.2 | Group Chat 编排 | `backend/ai-service/app/agents/group_chat.py` |
| 4.3 | 任务分发器 | `backend/ai-service/app/agents/dispatcher.py` |
| 4.4 | 对话历史管理 | `backend/ai-service/app/agents/memory.py` |
| 4.5 | WebSocket 推送 | `backend/ai-service/app/api/websocket.py` |

### Phase 5: 项目任务系统

| Task | 说明 | 文件 |
|------|------|------|
| 5.1 | 项目 CRUD API | `src/app/api/projects/` |
| 5.2 | 任务流程状态机 | `backend/ai-service/app/agents/workflow.py` |
| 5.3 | RAG 检索服务 | `backend/ai-service/app/rag/retriever.py` |
| 5.4 | 知识向量入库 | `backend/ai-service/app/rag/indexer.py` |
| 5.5 | 3 个示例项目配置 | `docker/init-db/003-sample-projects.sql` |

### Phase 6: 集成测试 + 优化

| Task | 说明 | 文件 |
|------|------|------|
| 6.1 | 端到端测试框架 | `frontend/__tests__/e2e/` |
| 6.2 | API 集成测试 | `backend/ai-service/tests/integration/` |
| 6.3 | 性能优化 | 各组件优化 |
| 6.4 | 移动端适配验证 | 多设备测试 |
| 6.5 | MVP 验收测试 | 测试清单 |

---

## 计划审查清单

在提交审查前，请确认：

- [ ] 所有任务都有明确的文件路径
- [ ] 每个任务包含完整的代码示例
- [ ] 测试命令和预期输出清晰
- [ ] Commit 消息符合规范
- [ ] 任务依赖关系正确

---

**计划创建完成**。下一步：Dispatch `plan-document-reviewer` subagent 进行审查。
