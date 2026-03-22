# Phase 7 & 8 实施计划：管理后台 + 动态场景生成器

> **版本**: 1.0
> **日期**: 2026-03-22
> **并行开发**: Phase 7 (管理后台) + Phase 8 (动态场景生成器)

---

## Phase 7: 管理后台开发

### 7.1 技术栈
- **前端**: Next.js 14 App Router, Tailwind CSS, shadcn/ui
- **认证**: NextAuth.js (管理员角色验证)
- **API**: Next.js API Routes
- **后端**: FastAPI 管理端点

### 7.2 目录结构
```
apps/web/src/app/admin/
├── layout.tsx          # 管理后台布局 (带侧边栏)
├── page.tsx            # 管理后台首页 (仪表盘)
├── projects/
│   ├── page.tsx        # 项目列表
│   ├── new/            # 创建项目
│   └── [id]/edit/      # 编辑项目
├── agents/
│   ├── page.tsx        # 智能体列表
│   ├── new/            # 创建智能体
│   └── [id]/edit/      # 编辑智能体
├── llm/
│   └── page.tsx        # LLM 配置
├── users/
│   └── page.tsx        # 用户管理
└── settings/
    └── page.tsx        # 系统设置
```

### 7.3 数据库变更
```prisma
// 新增管理员角色
enum Role {
  USER
  ADMIN
}

model User {
  role Role @default(USER)
  // ... existing fields
}

// 新增 LLM 配置表
model LlmConfig {
  id          String   @id @default(uuid())
  provider    String   @unique  // openai, anthropic, aliyun, etc.
  apiKey      String
  baseUrl     String?
  models      Json?    // 支持的模型列表
  isActive    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("llm_configs")
}

// 新增智能体配置表
model AgentConfig {
  id          String   @id @default(uuid())
  agentType   String   @unique
  name        String
  description String?
  personality Json?
  skills      Json?
  appearance  Json?    // 外观配置
  isEnabled   Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("agent_configs")
}
```

### 7.4 API 端点
```
# 项目管理
GET    /api/admin/projects          # 获取项目列表
POST   /api/admin/projects          # 创建项目
PUT    /api/admin/projects/[id]     # 更新项目
DELETE /api/admin/projects/[id]     # 删除项目

# 智能体管理
GET    /api/admin/agents            # 获取智能体列表
POST   /api/admin/agents            # 创建智能体
PUT    /api/admin/agents/[id]       # 更新智能体
DELETE /api/admin/agents/[id]       # 删除智能体

# LLM 配置
GET    /api/admin/llm               # 获取 LLM 配置
PUT    /api/admin/llm/[provider]    # 更新 LLM 配置

# 用户管理
GET    /api/admin/users             # 获取用户列表
PUT    /api/admin/users/[id]/role   # 更新用户角色
```

### 7.5 管理员认证中间件
```typescript
// apps/web/src/middleware.ts
import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })

  // 访问管理后台需要管理员权限
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!token || token.role !== 'admin') {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return NextResponse.next()
}
```

---

## Phase 8: 动态场景生成器

### 8.1 场景类型
| 场景类型 | 描述 | 触发条件 |
|---------|------|---------|
| 校园场景 | 默认场景 | project.subject === 'general' |
| 实验室 | 科学实验项目 | subject === 'science' 或 tags 包含 '实验' |
| 办公室 | 商业/办公项目 | subject === 'business' 或 tags 包含 '办公' |
| 户外 | 户外探索项目 | subject === 'outdoor' 或 tags 包含 '户外' |
| 工厂 | 工程/制造项目 | subject === 'engineering' 或 tags 包含 '制造' |
| 艺术工作室 | 艺术创作项目 | subject === 'art' 或 tags 包含 '艺术' |

### 8.2 场景模板结构
```typescript
interface SceneTemplate {
  id: string;
  type: SceneType;
  name: string;
  description: string;

  // 视觉配置
  groundColor: number;
  skyColor: number;
  lighting: LightingConfig;

  // 元素配置
  buildings: BuildingTemplate[];
  decorations: DecorationTemplate[];
  props: PropTemplate[];

  // 碰撞配置
  collisionZones: CollisionZone[];

  // 出生点配置
  spawnPoints: SpawnPoint[];
}

interface BuildingTemplate {
  type: 'lab' | 'office' | 'studio' | 'warehouse';
  x: number;
  y: number;
  width: number;
  height: number;
  texture: string;
}

interface DecorationTemplate {
  type: 'tree' | 'plant' | 'furniture' | 'equipment';
  x: number;
  y: number;
  texture: string;
  scale?: number;
}
```

### 8.3 场景生成器类
```typescript
// apps/web/src/components/game/generators/SceneGenerator.ts

export class SceneGenerator {
  private templates: Map<SceneType, SceneTemplate>;

  constructor() {
    this.templates = new Map();
    this.registerDefaultTemplates();
  }

  /**
   * 根据项目元数据生成场景
   */
  async generateFromProject(project: ProjectMeta): Promise<SceneTemplate> {
    const sceneType = this.determineSceneType(project);
    return this.generate(sceneType, project);
  }

  /**
   * 根据学科和标签确定场景类型
   */
  private determineSceneType(project: ProjectMeta): SceneType {
    const subjectScenes: Record<string, SceneType> = {
      'science': 'laboratory',
      'physics': 'laboratory',
      'chemistry': 'laboratory',
      'biology': 'laboratory',
      'business': 'office',
      'economics': 'office',
      'outdoor': 'outdoor',
      'geography': 'outdoor',
      'engineering': 'factory',
      'technology': 'factory',
      'art': 'studio',
      'design': 'studio',
    };

    // 优先检查标签
    const tagScenes: Record<string, SceneType> = {
      '实验': 'laboratory',
      'experiment': 'laboratory',
      '办公': 'office',
      'office': 'office',
      '户外': 'outdoor',
      'outdoor': 'outdoor',
      '制造': 'factory',
      'making': 'factory',
      '艺术': 'studio',
      'art': 'studio',
    };

    // 标签优先级更高
    for (const tag of project.tags || []) {
      if (tagScenes[tag]) return tagScenes[tag];
    }

    // 回退到学科
    if (project.subject && subjectScenes[project.subject]) {
      return subjectScenes[project.subject];
    }

    // 默认校园场景
    return 'campus';
  }

  /**
   * 生成场景（基于模板 + 随机变化）
   */
  private generate(sceneType: SceneType, project: ProjectMeta): SceneTemplate {
    const baseTemplate = this.templates.get(sceneType) || this.templates.get('campus')!;

    // 根据项目难度调整场景复杂度
    const complexity = this.getComplexityMultiplier(project.difficulty);

    return {
      ...baseTemplate,
      decorations: this.randomizeDecorations(baseTemplate.decorations, complexity),
      props: this.selectPropsForProject(baseTemplate.props, project),
      lighting: this.adjustLighting(baseTemplate.lighting, sceneType),
    };
  }

  private registerDefaultTemplates(): void {
    // 注册所有默认场景模板
    this.templates.set('campus', this.createCampusTemplate());
    this.templates.set('laboratory', this.createLaboratoryTemplate());
    this.templates.set('office', this.createOfficeTemplate());
    this.templates.set('outdoor', this.createOutdoorTemplate());
    this.templates.set('factory', this.createFactoryTemplate());
    this.templates.set('studio', this.createStudioTemplate());
  }
}
```

### 8.4 实验室场景模板示例
```typescript
private createLaboratoryTemplate(): SceneTemplate {
  return {
    id: 'laboratory-001',
    type: 'laboratory',
    name: '科学实验室',

    groundColor: 0x8B9BB4, // 灰色地板
    skyColor: 0xE8F4F8,    // 浅蓝天空

    lighting: {
      ambient: 0xFFFFFF,
      intensity: 0.8,
      shadows: true,
    },

    buildings: [
      {
        type: 'lab',
        x: 5,
        y: 5,
        width: 12,
        height: 8,
        texture: 'lab-building',
      },
      {
        type: 'lab',
        x: 25,
        y: 5,
        width: 10,
        height: 6,
        texture: 'lab-equipment-room',
      },
    ],

    decorations: [
      { type: 'equipment', x: 8, y: 10, texture: 'microscope' },
      { type: 'equipment', x: 12, y: 10, texture: 'test-tubes' },
      { type: 'furniture', x: 20, y: 8, texture: 'lab-desk' },
      { type: 'furniture', x: 24, y: 8, texture: 'storage-cabinet' },
      { type: 'plant', x: 30, y: 15, texture: 'potted-plant' },
    ],

    collisionZones: [
      { x: 5, y: 5, width: 12, height: 8, solid: true },
      { x: 25, y: 5, width: 10, height: 6, solid: true },
    ],

    spawnPoints: [
      { x: 15, y: 20, label: 'entrance' },
      { x: 10, y: 15, label: 'lab-bench' },
    ],
  };
}
```

---

## 执行策略

### 并行开发分工

| 智能体 | 任务 | 输出文件 |
|-------|------|---------|
| **Frontend Agent** | Phase 7 管理后台 UI | `/admin` 路由组件 |
| **Backend Agent** | Phase 7 管理后台 API | API 端点 + Prisma schema |
| **PixiJS Agent** | Phase 8 场景生成器 | `SceneGenerator.ts` + 场景模板 |

### Git 工作流

```bash
# 为每个 phase 创建独立 worktree
git worktree add .worktrees/phase-7 feature/phase-7-admin
git worktree add .worktrees/phase-8 feature/phase-8-scene-generator

# 每 30 分钟检查未提交的更改
# 每完成一个子任务就提交
# 每天合并到 main 分支 (CI 通过后)
```

### 提交规范

```bash
# Phase 7 提交格式
feat(phase-7): [component] description
  - feat(phase-7): add admin layout with sidebar
  - feat(phase-7): create project management CRUD
  - feat(phase-7): add LLM configuration page

# Phase 8 提交格式
feat(phase-8): [scene-type] description
  - feat(phase-8): add scene generator base class
  - feat(phase-8): create laboratory scene template
  - feat(phase-8): implement office scene template
```

---

## 完成检查清单

### Phase 7
- [ ] 管理员认证中间件
- [ ] /admin 布局组件（带侧边栏）
- [ ] 项目管理 CRUD 界面
- [ ] 智能体管理界面
- [ ] LLM 配置界面
- [ ] 用户管理界面
- [ ] 后端 API 端点
- [ ] Prisma schema 更新

### Phase 8
- [ ] SceneGenerator 基类
- [ ] 场景类型判定逻辑
- [ ] 校园场景模板（已有）
- [ ] 实验室场景模板
- [ ] 办公室场景模板
- [ ] 户外场景模板
- [ ] 工厂场景模板
- [ ] 艺术工作室模板
- [ ] 场景过渡动画

---

**文档结束**
