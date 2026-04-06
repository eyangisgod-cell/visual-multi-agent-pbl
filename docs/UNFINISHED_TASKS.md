# 未完成开发任务清单 - 2026-04-06

**会话 ID**: Phase-5-Complete
**保存时间**: 2026-04-06
**分支**: main
**项目**: visual-multi-agent-pbl

---

## Phase 5 完成状态

✅ **Phase 5 - 项目任务系统开发** 已完成并提交
- 项目 CRUD API 实现
- 项目管理页面 UI
- 创建/编辑/删除项目功能
- 5 个 E2E 测试全部通过

**提交哈希**: 0b26b59
**提交时间**: 2026-04-06

---

## 未完成的开发任务 (按优先级排序)

### 优先级 1: Task #157 作品系统开发

| Task | 名称 | 状态 | 说明 |
|------|------|------|------|
| 157.1 | 作品 CRUD API | ❌ | 作品创建、读取、更新、删除 |
| 157.2 | 作品展示页面 | ❌ | 作品列表和详情页面 |
| 157.3 | 作品上传功能 | ❌ | MinIO 对象存储集成 |
| 157.4 | 作品评价系统 | ❌ | 点赞、评论功能 |

**预计工作量**: 2-3 天
**依赖**: Phase 5 完成 ✅

**关键文件**:
- `apps/web/src/app/api/admin/works/route.ts`
- `apps/web/src/app/admin/works/page.tsx`
- `apps/web/src/app/api/works/[id]/route.ts`

---

### 优先级 2: Phase 7 - 管理后台完善

| Task | 名称 | 状态 | 说明 |
|------|------|------|------|
| 7.1 | 管理后台脚手架 | ⚠️ | 已有 /admin 目录，但使用了 web 应用的布局 |
| 7.2 | 用户管理页面 | ✅ | `apps/web/src/app/admin/users/page.tsx` |
| 7.3 | 作品审核页面 | ❌ | 缺少作品审核功能 |
| 7.4 | 项目管理页面 | ⚠️ | 基础 CRUD 完成，缺少分页和搜索优化 |
| 7.5 | 智能体配置页面 | ⚠️ | 页面存在但功能待完善 |
| 7.6 | 审计日志 | ❌ | 数据库表和 API 均未实现 |

**具体待实现**:
- [ ] 作品审核列表 API (`/api/admin/works`)
- [ ] 作品审核操作 API (`/api/admin/works/[id]/review`)
- [ ] 审计日志表 (`audit_logs`)
- [ ] 审计日志查询 API

**预计工作量**: 1-2 天

---

### 优先级 3: Task #159 WebSocket 实时通信

| Task | 名称 | 状态 | 说明 |
|------|------|------|------|
| 159.1 | WebSocket 服务器 | ❌ | FastAPI WebSocket 端点 |
| 159.2 | 前端连接管理 | ❌ | WebSocket hook 和状态管理 |
| 159.3 | 实时消息推送 | ❌ | 智能体对话推送 |
| 159.4 | 在线状态追踪 | ❌ | 用户在线状态管理 |

**预计工作量**: 2-3 天
**依赖**: 作品系统基础功能

**关键文件**:
- `apps/ai-service/app/websocket/` (后端)
- `apps/web/src/hooks/useWebSocket.ts` (前端)

---

### 优先级 4: Phase 9 - 智能体记忆系统

| Task | 名称 | 状态 | 说明 |
|------|------|------|------|
| 9.1 | Prisma schema 扩展 | ❌ | 缺少 AgentMemory 和 AgentEvolution 表 |
| 9.2 | AI Service 记忆 API | ❌ | Python AI 服务记忆端点 |
| 9.3 | 向量嵌入计算 | ⚠️ | pgvector 已配置，嵌入模型待集成 |
| 9.4 | 记忆巩固机制 | ❌ | 短期记忆转长期记忆逻辑 |

**需要添加到 schema.prisma**:
```prisma
model AgentMemory {
  id          String   @id @default(uuid())
  agentId     String   @map("agent_id") @db.Uuid
  type        MemoryType
  content     String   @db.Text
  embedding   Unsupported("vector(384)")?
  importance  Int      @default(1)
  tags        String[]
  createdAt   DateTime @default(now()) @map("created_at")
}

enum MemoryType {
  SHORT_TERM
  LONG_TERM
  EPISODIC
  PROCEDURAL
  SEMANTIC
}

model AgentEvolution {
  id          String   @id @default(uuid())
  agentId     String   @map("agent_id") @db.Uuid
  changeType  EvolutionType
  description String   @db.Text
  beforeState Json?   @map("before_state")
  afterState  Json?   @map("after_state")
  createdAt   DateTime @default(now()) @map("created_at")
}

enum EvolutionType {
  PERSONALITY_UPDATE
  SKILL_ACQUISITION
  BEHAVIOR_ADJUSTMENT
  KNOWLEDGE_EXPANSION
  PREFERENCE_CHANGE
}
```

**预计工作量**: 2-3 天

---

### 优先级 5: Phase 10 - 智能体形象配置器

| Task | 名称 | 状态 | 说明 |
|------|------|------|------|
| 10.1 | 形象配置器 UI | ❌ | 缺少配置器页面 |
| 10.2 | PixiJS 预览组件 | ❌ | 实时预览功能 |
| 10.3 | 5 种智能体预设 | ⚠️ | 基础智能体存在，缺少预设配置 |
| 10.4 | 形象配置 API | ❌ | 配置存储端点 |

**预计工作量**: 2-3 天

---

### 优先级 6: Phase 11 - PWA 配置

| Task | 名称 | 状态 | 说明 |
|------|------|------|------|
| 11.1 | next-pwa 配置 | ❌ | Service Worker 配置 |
| 11.2 | manifest.json | ❌ | PWA manifest |
| 11.3 | 离线缓存策略 | ❌ | 离线页面和缓存 |
| 11.4 | 移动端优化 | ⚠️ | 响应式布局待完善 |

**预计工作量**: 1-2 天

---

## 技术债务

### 数据库连接问题
- **现象**: Windows 主机无法通过 localhost:5432 连接 Docker PostgreSQL
- **临时方案**: 使用 socat 端口转发器（端口 5433）
- **长期解决方案**:
  1. 重启 Docker Desktop 并重置网络设置
  2. 在 Docker Desktop 设置中启用 "Use WSL 2 based engine"
  3. 或者将开发环境迁移到 WSL2 Ubuntu

### Dashboard API 错误
- **错误**: `Cannot read properties of undefined (reading 'count')`
- **位置**: `apps/web/src/app/api/admin/dashboard/route.ts:18`
- **影响**: 不影响 E2E 测试，但需要修复

---

## 下一步行动计划

### 立即行动
1. **开始 Task #157 作品系统开发**
   - 先创建 E2E 测试
   - 实现作品 CRUD API
   - 创建作品管理页面

### 开发顺序
1. Task #157 作品系统开发 (2-3 天)
2. Phase 7 管理后台完善 (1-2 天)
3. Task #159 WebSocket 实时通信 (2-3 天)
4. Phase 9 智能体记忆系统 (2-3 天)
5. Phase 10 形象配置器 (2-3 天)
6. Phase 11 PWA 配置 (1-2 天)

**总计预计**: 10-16 天

---

## 环境配置提醒

### 启动开发环境
```bash
# 1. 启动 socat 端口转发器
docker run -d --name port-forwarder -p 5433:5432 \
  alpine/socat TCP-LISTEN:5432,fork,reuseaddr TCP:docker-postgres-1:5432

# 2. 启动 Next.js 开发服务器
cd apps/web
npm run dev
```

### 运行 E2E 测试
```bash
cd apps/web
npx playwright test tests/e2e/project-tasks.spec.ts
```

### 数据库连接
- URL: `postgresql://postgres:postgres@localhost:5433/pbl_platform`
- Prisma binary targets: `["native", "linux-musl", "debian-openssl-3.0.x"]`

---

**文档生成时间**: 2026-04-06
**下次更新**: Phase 7 或 Task #157 完成后
