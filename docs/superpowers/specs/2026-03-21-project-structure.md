# 项目目录结构规范

**版本**: 1.0
**日期**: 2026-03-21

---

## 优化后的完整目录结构

```
visual-multi-agent-pbl/
│
├── .git/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── docker-build.yml
│
├── docs/
│   ├── superpowers/
│   │   ├── specs/              # 设计文档
│   │   │   ├── 2026-03-21-visual-pbl-platform-design.md
│   │   │   ├── 2026-03-21-technical-architecture.md
│   │   │   ├── 2026-03-21-architecture-decisions.md
│   │   │   ├── 2026-03-21-pending-issues.md
│   │   │   └── 2026-03-21-database-schema.md
│   │   ├── plans/              # 实施计划
│   │   │   ├── README.md                        # 计划索引
│   │   │   ├── phase-00-development-env.md      # Phase 0: 开发环境
│   │   │   ├── phase-01-user-auth.md            # Phase 1: 用户认证
│   │   │   ├── phase-02-pixi-game.md            # Phase 2: PixiJS 游戏
│   │   │   ├── phase-03-agent-render.md         # Phase 3: 智能体渲染
│   │   │   ├── phase-04-ag2-service.md          # Phase 4: AG2 服务
│   │   │   ├── phase-05-project-system.md       # Phase 5: 项目系统
│   │   │   ├── phase-06-integration-test.md     # Phase 6: 集成测试
│   │   │   └── phase-07-admin-panel.md          # Phase 7: 管理后台
│   │   └── INDEX.md
│   └── README.md
│
├── apps/
│   ├── web/                    # Next.js 前端应用（学生端）
│   │   ├── src/
│   │   │   ├── app/            # Next.js App Router
│   │   │   │   ├── (public)/   # 公开页面
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── auth/
│   │   │   │   │       ├── login/page.tsx
│   │   │   │   │       └── register/page.tsx
│   │   │   │   ├── (student)/  # 学生页面（需登录）
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── game/page.tsx
│   │   │   │   │   ├── projects/
│   │   │   │   │   ├── works/
│   │   │   │   │   └── profile/page.tsx
│   │   │   │   ├── api/        # API Routes
│   │   │   │   │   ├── auth/
│   │   │   │   │   ├── projects/
│   │   │   │   │   └── works/
│   │   │   │   └── layout.tsx
│   │   │   ├── components/
│   │   │   │   ├── pixi/       # PixiJS 渲染组件
│   │   │   │   │   ├── GameCanvas.tsx
│   │   │   │   │   ├── GameApp.ts
│   │   │   │   │   ├── layers/
│   │   │   │   │   ├── sprites/
│   │   │   │   │   └── systems/
│   │   │   │   ├── ui/         # 通用 UI 组件
│   │   │   │   └── layout/     # 布局组件
│   │   │   ├── lib/
│   │   │   │   ├── api.ts      # API 客户端
│   │   │   │   ├── websocket.ts
│   │   │   │   └── prisma.ts
│   │   │   ├── store/          # Zustand 状态管理
│   │   │   │   ├── gameStore.ts
│   │   │   │   └── userStore.ts
│   │   │   └── types/
│   │   ├── public/
│   │   │   ├── sprites/        # 像素精灵图
│   │   │   └── avatars/        # 智能体头像
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── package.json
│   │   ├── next.config.js
│   │   ├── tailwind.config.js
│   │   ├── tsconfig.json
│   │   ├── Dockerfile
│   │   └── __tests__/
│   │
│   ├── admin/                  # Next.js 管理后台
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/
│   │   │   │   │   └── login/page.tsx
│   │   │   │   ├── (dashboard)/
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── users/
│   │   │   │   │   ├── projects/
│   │   │   │   │   ├── works/
│   │   │   │   │   ├── agents/
│   │   │   │   │   └── knowledge/
│   │   │   │   └── api/
│   │   │   ├── components/
│   │   │   │   ├── tables/
│   │   │   │   ├── forms/
│   │   │   │   └── charts/
│   │   │   └── lib/
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── ...
│   │
│   └── ai-service/             # Python FastAPI 后端
│       ├── app/
│       │   ├── __init__.py
│       │   ├── main.py         # FastAPI 应用入口
│       │   ├── config.py       # 配置管理
│       │   ├── api/            # API 路由层
│       │   │   ├── __init__.py
│       │   │   ├── deps.py     # 依赖注入
│       │   │   ├── health.py
│       │   │   ├── agents.py
│       │   │   ├── rag.py
│       │   │   └── websocket.py
│       │   ├── core/           # 核心业务逻辑（DDD 域层）
│       │   │   ├── __init__.py
│       │   │   ├── agents/     # 智能体域
│       │   │   │   ├── __init__.py
│       │   │   │   ├── entities.py
│       │   │   │   ├── value_objects.py
│       │   │   │   ├── services.py
│       │   │   │   └── repositories.py
│       │   │   ├── projects/   # 项目域
│       │   │   │   ├── __init__.py
│       │   │   │   ├── entities.py
│       │   │   │   ├── value_objects.py
│       │   │   │   └── services.py
│       │   │   └── knowledge/  # 知识域
│       │   │       ├── __init__.py
│       │   │       ├── entities.py
│       │   │       └── services.py
│       │   ├── infrastructure/ # 基础设施层（DDD 基础设施层）
│       │   │   ├── __init__.py
│       │   │   ├── database.py
│       │   │   ├── redis.py
│       │   │   ├── minio.py
│       │   │   └── llm/
│       │   │       ├── __init__.py
│       │   │       ├── client.py
│       │   │       └── providers.py
│       │   ├── adapters/       # 适配层（DDD 适配层）
│       │   │   ├── __init__.py
│       │   │   ├── ag2_adapter.py
│       │   │   └── rag_adapter.py
│       │   ├── models/         # SQLAlchemy 模型
│       │   │   ├── __init__.py
│       │   │   ├── user.py
│       │   │   ├── project.py
│       │   │   ├── agent.py
│       │   │   ├── work.py
│       │   │   └── knowledge.py
│       │   ├── schemas/        # Pydantic Schema
│       │   │   ├── __init__.py
│       │   │   ├── user.py
│       │   │   ├── project.py
│       │   │   └── agent.py
│       │   └── services/       # 应用服务层
│       │       ├── __init__.py
│       │       ├── agent_orchestration.py
│       │       ├── rag_service.py
│       │       └── workflow_service.py
│       ├── tests/
│       │   ├── __init__.py
│       │   ├── unit/
│       │   ├── integration/
│       │   └── e2e/
│       ├── alembic/
│       │   ├── env.py
│       │   └── versions/
│       ├── requirements.txt
│       ├── requirements-dev.txt
│       ├── Dockerfile
│       └── pyproject.toml
│
├── docker/
│   ├── docker-compose.dev.yml      # 开发环境
│   ├── docker-compose.prod.yml     # 生产环境
│   ├── docker-compose.test.yml     # 测试环境
│   └── init-db/
│       ├── 001-schema.sql
│       ├── 002-seed.sql
│       └── 003-sample-projects.sql
│
├── scripts/
│   ├── setup-dev.sh
│   ├── setup-dev.ps1
│   ├── seed-data.py
│   └── deploy.sh
│
├── .gitignore
├── .env.example
├── README.md
└── docker-compose.yml              # 快捷入口（链接到 docker/）
```

---

## 目录设计规范

### 应用层（apps/）

| 目录 | 说明 | 技术栈 |
|------|------|--------|
| `apps/web/` | 学生端 Web 应用 | Next.js + PixiJS |
| `apps/admin/` | 管理后台 | Next.js + shadcn/ui |
| `apps/ai-service/` | AI 微服务 | FastAPI + AG2 |

### DDD 分层（ai-service）

```
app/
├── api/              # 接口层 - HTTP/WebSocket 入口
├── core/             # 域层 - 核心业务逻辑（实体、值对象、领域服务）
├── infrastructure/   # 基础设施层 - 数据库、缓存、外部 API
├── adapters/         # 适配层 - 第三方库适配（AG2、RAG）
└── services/         # 应用服务层 - 用例编排
```

### 为什么这样设计？

1. **Monorepo 结构** - 前后端统一管理，版本一致
2. **DDD 分层** - 业务逻辑清晰，便于测试和维护
3. **模块化** - 按业务域划分，后期可拆分微服务
4. **类型安全** - TypeScript + Python 类型检查

---

## 文件命名规范

### TypeScript/React

- 组件：`PascalCase.tsx` (e.g., `GameCanvas.tsx`)
- 工具函数：`camelCase.ts` (e.g., `apiClient.ts`)
- 类型定义：`PascalCase.ts` (e.g., `GameState.ts`)
- 测试文件：`*.test.ts` 或 `*.spec.ts`

### Python

- 模块：`snake_case.py` (e.g., `user_service.py`)
- 类：`PascalCase` (e.g., `UserEntity`)
- 函数：`snake_case` (e.g., `get_user_by_id`)
- 测试文件：`test_*.py`

---

## 环境变量规范

```bash
# .env.example

# 数据库
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pbl_platform

# Redis
REDIS_URL=redis://localhost:6379

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123

# JWT
JWT_SECRET=change-this-in-production

# AI 服务
AI_SERVICE_URL=http://localhost:8000
LLM_PROVIDER=aliyun
LLM_API_KEY=your-api-key

# 前端
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change-this-in-production
```

---

**文档结束**
