# 游戏页面问题分析与待开发功能报告

**日期**: 2026-04-20  
**页面**: http://localhost:3001/game  
**状态**: 🔴 严重缺失功能

---

## 📋 问题诊断

### 当前游戏页面状态

| 功能 | 状态 | 说明 |
|------|------|------|
| 玩家移动 | ⚠️ 部分实现 | WASD/方向键可移动，但碰撞检测有问题 |
| 智慧导师智能体 | ✅ 已实现 | MentorAgent 精灵已创建 |
| 其他 4 种智能体 | ⚠️ 部分实现 | 类已定义但未在场景中使用 |
| 智能体对话 | ⚠️ 部分实现 | SpeechBubble 存在，但无实际对话逻辑 |
| 任务系统 | ❌ 未实现 | 无任务分配、调度功能 |
| 多智能体协作 | ❌ 未实现 | 无智能体任务执行逻辑 |
| 游戏场景美化 | ❌ 未实现 | 只有简单像素块，无美观背景 |
| 任务界面 UI | ❌ 未实现 | 无任务面板、智能体选择面板 |

---

## 🔍 根本原因分析

### 1. 智能体渲染问题

**问题**: 场景中使用 `MentorAgent` 类创建所有 5 个智能体，而不是使用各自类型

**代码位置**: `CampusScene.ts:343`
```typescript
// 问题代码 - 所有智能体都用 MentorAgent 创建
const agent = new MentorAgent(config.x * this.TILE_SIZE, config.y * this.TILE_SIZE)
```

**应改为**:
```typescript
const agentMap = {
  mentor: MentorAgent,
  designer: DesignerAgent,
  analyst: AnalystAgent,
  marketer: MarketerAgent,
  assistant: AssistantAgent,
}
const AgentClass = agentMap[config.id as keyof typeof agentMap] || MentorAgent
const agent = new AgentClass(config.x * this.TILE_SIZE, config.y * this.TILE_SIZE)
```

---

### 2. 智能体对话系统缺失

**问题**: 点击智能体只显示固定文本，无实际 AI 对话

**当前代码**: `CampusScene.ts:346-349`
```typescript
const handleClick = () => {
  this.showSpeechBubble(agent, `你好！我是${config.name}，很高兴为你服务。`)
}
```

**需要**: 
- 连接后端 AI 服务 (`http://localhost:8000`)
- 实现真实的 LLM 对话
- 支持上下文记忆

---

### 3. 任务系统完全缺失

**问题**: 没有任何任务相关的 UI 或逻辑

**需要实现**:
```typescript
// 缺失的组件
- TaskPanel.tsx        // 任务列表面板
- TaskDetail.tsx       // 任务详情
- TaskAssignment.tsx   // 任务分配界面
- AgentScheduler.tsx   // 智能体调度器
```

---

### 4. 多智能体调度缺失

**问题**: 智能体只能显示，不能执行任务

**需要实现**:
```typescript
// 缺失的服务
- AgentTeamOrchestrator.ts  // 智能体编排
- TaskDispatcher.ts         // 任务分发
- AgentCommunication.ts     // 智能体间通信
```

---

### 5. 游戏场景美化缺失

**问题**: 只有简单的色块，没有吸引人的像素艺术

**需要**:
- 精美的像素风背景图
- 动画效果（云朵飘动、树叶摇曳）
- 粒子效果（阳光、雾气）
- 建筑 sprite 代替色块

---

## 📝 原始游戏界面需求

根据 MVP 计划文档 (`2026-03-21-visual-pbl-mvp-plan.md`)，游戏界面应实现：

### Phase 2: PixiJS 游戏场景

| 功能 | 描述 | 状态 |
|------|------|------|
| 2D 俯视视角 | 像素风校园场景 | ⚠️ 基础实现 |
| 可行走地面 | 草地、道路铺设 | ✅ 已实现 |
| 建筑物 | 碰撞区域 | ⚠️ 色块代替 |
| 树木装饰 | 装饰物 | ⚠️ 简单 sprite |
| 路径系统 | 场景间道路 | ✅ 已实现 |

### Phase 3: 智能体渲染系统

| 功能 | 描述 | 状态 |
|------|------|------|
| 5 种智能体外观 | 独特 sprite | ⚠️ 类存在但未使用 |
| 移动动画 | idle/walk 动画 | ❌ 未实现 |
| 对话气泡 | 说话气泡 | ⚠️ 基础实现 |
| 状态指示器 | idle/thinking/speaking | ⚠️ 部分实现 |
| 点击交互 | 选择/对话 | ⚠️ 基础实现 |

### Phase 4: AG2 智能体服务 (完全缺失)

| 功能 | 描述 | 状态 |
|------|------|------|
| 多智能体协作 | AG2 框架 | ❌ 未实现 |
| 任务分发 | 智能体分配任务 | ❌ 未实现 |
| 对话管理 | 上下文对话 | ❌ 未实现 |
| 记忆系统 | 长期记忆 | ❌ 未实现 |

---

## 🎯 待开发功能清单

### 高优先级 (核心玩法)

#### 1. 修复智能体渲染
- [ ] 使用正确的智能体类 (DesignerAgent, AnalystAgent 等)
- [ ] 添加智能体 idle 动画
- [ ] 添加智能体移动动画

#### 2. 实现真实对话
- [ ] 连接 AI 服务 `/api/chat` 端点
- [ ] 实现流式响应显示
- [ ] 添加对话历史记忆

#### 3. 任务系统 UI
- [ ] 任务列表面板 (左侧)
- [ ] 任务详情面板 (右侧)
- [ ] 创建任务按钮和表单
- [ ] 任务进度指示器

#### 4. 智能体调度
- [ ] 智能体选择器 (从 5 种智能体中选择)
- [ ] 任务分配界面
- [ ] 智能体执行状态显示
- [ ] 多智能体协作编排

#### 5. 场景美化
- [ ] 替换色块为精美 sprite
- [ ] 添加动画背景元素
- [ ] 添加环境音效

---

### 中优先级 (增强体验)

#### 6. 玩家功能增强
- [ ] 玩家 sprite 动画优化
- [ ] 跑步/行走切换
- [ ] 表情/动作系统

#### 7. 智能体行为
- [ ] 智能体自主移动
- [ ] 智能体间互动
- [ ] 智能体情绪系统

#### 8. 任务类型
- [ ] 学习任务 (阅读、测验)
- [ ] 项目任务 (开发、设计)
- [ ] 协作任务 (多智能体)

---

### 低优先级 (锦上添花)

#### 9. 成就系统
- [ ] 成就解锁通知
- [ ] 勋章展示
- [ ] 排行榜

#### 10. 社交功能
- [ ] 多人在线 (看到其他玩家)
- [ ] 聊天系统
- [ ] 好友系统

---

## 🔧 技术实现建议

### 1. 智能体调度架构

```typescript
// 新的调度器架构
class AgentOrchestrator {
  // 智能体池
  private agents: Map<string, AgentSprite>
  
  // 任务队列
  private taskQueue: Task[]
  
  // 分配任务给最合适的智能体
  assignTask(task: Task): AgentSprite {
    const bestAgent = this.selectBestAgent(task)
    this.executeTask(bestAgent, task)
    return bestAgent
  }
  
  // 多智能体协作
  async collaborate(task: Task, agents: string[]): Promise<Result> {
    // 使用 AG2 框架协调
  }
}
```

### 2. 对话系统集成

```typescript
// 连接后端 AI 服务
class AIService {
  async chat(agentId: string, message: string, context: Context): Promise<Response> {
    const res = await fetch('http://localhost:8000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        agent_id: agentId,
        message,
        context,
      }),
    })
    return res.json()
  }
}
```

### 3. 任务数据结构

```typescript
interface Task {
  id: string
  title: string
  description: string
  type: 'learning' | 'project' | 'collaboration'
  requiredAgents: string[]  // ['mentor', 'designer']
  status: 'pending' | 'in_progress' | 'completed'
  progress: number
  assignedAgents: string[]
  createdAt: Date
  deadline?: Date
}
```

---

## 📊 开发优先级排序

| 优先级 | 功能 | 预计工时 | 依赖 |
|--------|------|----------|------|
| P0 | 修复智能体渲染 | 2 小时 | - |
| P0 | 连接 AI 对话服务 | 4 小时 | Python AI 服务 |
| P0 | 任务系统 UI | 6 小时 | - |
| P1 | 智能体调度器 | 8 小时 | 任务 UI |
| P1 | 多智能体协作 | 8 小时 | AG2 框架 |
| P2 | 场景美化 | 6 小时 | 美术资源 |

---

## 🎮 完整游戏体验流程

```
1. 学生登录 → 进入虚拟校园
2. 查看任务面板 → 选择/创建任务
3. 点击智能体 → 对话咨询
4. 分配任务 → 选择需要的智能体
5. 智能体协作 → 执行任务
6. 查看进度 → 完成任务
7. 获得积分/成就 → 升级
```

---

## 📌 下一步行动

1. **立即修复** (P0):
   - [ ] 修复 CampusScene 使用正确的智能体类
   - [ ] 添加智能体点击对话连接 AI 服务
   
2. **本周完成** (P1):
   - [ ] 实现任务面板 UI
   - [ ] 实现智能体选择器
   - [ ] 实现任务分配逻辑

3. **下周完成** (P2):
   - [ ] 场景美术资源替换
   - [ ] 多智能体协作编排

---

*报告生成时间：2026-04-20*
