# Phase 9-11 实施计划

> **版本**: 1.0
> **日期**: 2026-03-22
> **并行开发**: Phase 9 (智能体记忆) + Phase 10 (形象配置器) + Phase 11 (PWA)

---

## Phase 9: 智能体记忆与进化系统

### 9.1 技术栈
- **向量数据库**: PostgreSQL + pgvector
- **嵌入模型**: sentence-transformers (AI Service)
- **记忆存储**: 向量嵌入 + 元数据
- **进化机制**: 基于交互经验的行为调整

### 9.2 数据库变更

```prisma
// 智能体记忆表
model AgentMemory {
  id          String   @id @default(uuid())
  agentId     String   @map("agent_id") @db.Uuid
  type        MemoryType
  content     String   @db.Text
  embedding   Unsupported("vector(384)")?
  importance  Int      @default(1)  // 重要性 1-10
  tags        String[]
  createdAt   DateTime @default(now()) @map("created_at")

  agent       AgentConfig @relation(fields: [agentId], references: [id])

  @@map("agent_memories")
}

enum MemoryType {
  SHORT_TERM    // 短期记忆（24 小时）
  LONG_TERM     // 长期记忆（永久）
  EPISODIC      // 情景记忆（事件记录）
  PROCEDURAL    // 程序记忆（技能）
  SEMANTIC      // 语义记忆（知识）
}

// 智能体进化日志
model AgentEvolution {
  id          String   @id @default(uuid())
  agentId     String   @map("agent_id") @db.Uuid
  changeType  EvolutionType
  description String   @db.Text
  beforeState Json?   @map("before_state")
  afterState  Json?   @map("after_state")
  triggerEvent String? @map("trigger_event")
  createdAt   DateTime @default(now()) @map("created_at")

  @@map("agent_evolution_logs")
}

enum EvolutionType {
  PERSONALITY_UPDATE
  SKILL_ACQUISITION
  BEHAVIOR_ADJUSTMENT
  KNOWLEDGE_EXPANSION
  PREFERENCE_CHANGE
}
```

### 9.3 AI Service API

```python
# apps/ai-service/app/api/memories.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import asyncpg
import numpy as np

router = APIRouter()

class MemoryCreate(BaseModel):
    agent_id: str
    type: str
    content: str
    importance: int = 1
    tags: List[str] = []

class MemoryQuery(BaseModel):
    query: str
    agent_id: Optional[str] = None
    memory_type: Optional[str] = None
    top_k: int = 5

@router.post("/memories")
async def create_memory(memory: MemoryCreate):
    """创建新记忆（自动计算向量嵌入）"""
    # 1. 使用 sentence-transformers 计算嵌入
    # 2. 存储到 PostgreSQL pgvector
    pass

@router.post("/memories/query")
async def query_memories(query: MemoryQuery):
    """向量相似度查询记忆"""
    # 1. 计算查询向量的嵌入
    # 2. PostgreSQL 向量相似度搜索
    # 3. 返回最相关的记忆
    pass

@router.post("/memories/consolidate")
async def consolidate_memories(agent_id: str):
    """记忆巩固：短期记忆转长期记忆"""
    # 1. 查询短期记忆
    # 2. 根据重要性筛选
    # 3. 转换为长期记忆
    pass

@router.get("/agents/{agent_id}/evolution")
async def get_agent_evolution(agent_id: str):
    """获取智能体进化历史"""
    pass
```

### 9.4 记忆系统架构

```
┌─────────────────────────────────────────────────────────┐
│                    Agent Memory System                   │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │Short-Term   │  │Long-Term    │  │Episodic     │     │
│  │Memory       │  │Memory       │  │Memory       │     │
│  │(24h expiry) │  │(permanent)  │  │(events)     │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│  ┌─────────────┐  ┌─────────────┐                      │
│  │Procedural   │  │Semantic     │                      │
│  │Memory       │  │Memory       │                      │
│  │(skills)     │  │(knowledge)  │                      │
│  └─────────────┘  └─────────────┘                      │
├─────────────────────────────────────────────────────────┤
│              Vector Search (pgvector)                    │
│              Similarity threshold: 0.7+                 │
└─────────────────────────────────────────────────────────┘
```

---

## Phase 10: 智能体形象配置器

### 10.1 技术栈
- **前端**: Next.js 14, Tailwind CSS, shadcn/ui
- **预览**: PixiJS 实时预览
- **存储**: MinIO 对象存储（形象资源）

### 10.2 形象配置项

```typescript
interface AgentAvatarConfig {
  // 基础外观
  bodyType: 'slim' | 'normal' | 'round';
  bodyColor: number;

  // 头部特征
  headShape: 'round' | 'square' | 'oval';
  hairstyle: string;  // 发型资源 ID
  hairColor: number;

  // 面部特征
  eyes: string;       // 眼睛样式
  eyeColor: number;
  mouth: string;      // 嘴巴样式
  eyebrows: string;   // 眉毛样式

  // 服饰
  outfit: string;     // 服装样式
  outfitColor: number;
  accessories: string[]; // 配饰（眼镜、帽子等）

  // 标识
  badge: string;      // 智能体类型徽章
  nameTag: string;    // 名字标签样式
}
```

### 10.3 目录结构

```
apps/web/src/app/admin/agents/configurator/
├── page.tsx              # 配置器主页面
├── AvatarPreview.tsx     # PixiJS 实时预览组件
├── BodyConfig.tsx        # 身体配置面板
├── HeadConfig.tsx        # 头部配置面板
├── FaceConfig.tsx        # 面部配置面板
├── OutfitConfig.tsx      # 服饰配置面板
└── presets/
    ├── mentor.ts         # 导师智能体预设
    ├── analyst.ts        # 分析师智能体预设
    ├── designer.ts       # 设计师智能体预设
    ├── marketer.ts       # 营销师智能体预设
    └── assistant.ts      # 助手智能体预设
```

### 10.4 API 端点

```
GET  /api/admin/agents/presets          # 获取形象预设列表
POST /api/admin/agents/presets          # 创建新预设
GET  /api/admin/agents/avatar/{id}      # 获取智能体形象配置
PUT  /api/admin/agents/avatar/{id]      # 更新形象配置
POST /api/admin/agents/avatar/upload    # 上传自定义资源
```

---

## Phase 11: PWA 完整配置

### 11.1 技术栈
- **Service Worker**: next-pwa + workbox
- **离线缓存**: App Shell + 静态资源
- **推送通知**: Firebase Cloud Messaging

### 11.2 配置文件

```javascript
// apps/web/next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?:\/\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24, // 24 小时
        },
      },
    },
    {
      urlPattern: /^https?:\/\/.*\.(png|jpg|jpeg|svg|gif)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-images',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 天
        },
      },
    },
  ],
});

module.exports = withPWA({
  // ... existing config
});
```

### 11.3 manifest.json

```json
{
  "name": "Visual PBL 平台",
  "short_name": "Visual PBL",
  "description": "项目式学习平台 with AI Agents",
  "start_url": "/game",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4f46e5",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["education", "productivity"],
  "screenshots": [
    {
      "src": "/screenshots/game.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ]
}
```

### 11.4 移动端优化

```css
/* apps/web/src/app/globals.css */
@media (max-width: 640px) {
  /* 移动端游戏画布适配 */
  #game-canvas {
    width: 100vw;
    height: 100vh;
    touch-action: none; /* 禁用浏览器手势 */
  }

  /* 移动端控制按钮 */
  .mobile-controls {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 20px;
    z-index: 1000;
  }
}
```

---

## 执行策略

### 并行开发分工

| 智能体 | 任务 | 输出文件 |
|-------|------|---------|
| **Backend Agent** | Phase 9 记忆系统 API | `apps/ai-service/app/api/memories.py` |
| **Database Agent** | Phase 9 Prisma schema | `apps/web/prisma/schema.prisma` |
| **Frontend Agent** | Phase 10 形象配置器 UI | `/admin/agents/configurator` |
| **PixiJS Agent** | Phase 10 预览组件 | `AvatarPreview.tsx` |
| **DevOps Agent** | Phase 11 PWA 配置 | `next.config.js`, `manifest.json` |

### Git 工作流

```bash
# 每个 phase 独立 worktree
git worktree add .worktrees/phase-9 feature/phase-9-agent-memory
git worktree add .worktrees/phase-10 feature/phase-10-agent-avatar
git worktree add .worktrees/phase-11 feature/phase-11-pwa

# 每 30 分钟检查提交
# 完成后自动创建 PR
# CI 通过后自动合并
```

---

## 完成检查清单

### Phase 9
- [ ] Prisma schema 添加 AgentMemory 和 AgentEvolution 表
- [ ] AI Service 记忆 API 端点
- [ ] 向量嵌入计算功能
- [ ] 记忆相似度查询
- [ ] 记忆巩固机制（短期→长期）
- [ ] 进化日志记录

### Phase 10
- [ ] 形象配置器 UI 页面
- [ ] PixiJS 实时预览组件
- [ ] 身体/头部/面部/服饰配置面板
- [ ] 5 种智能体预设配置
- [ ] 形象配置 API 端点
- [ ] 资源上传功能

### Phase 11
- [ ] next-pwa 配置
- [ ] manifest.json
- [ ] Service Worker 缓存策略
- [ ] 离线页面
- [ ] 移动端响应式布局
- [ ] 添加主屏幕提示
- [ ] 推送通知基础配置

---

**文档结束**
