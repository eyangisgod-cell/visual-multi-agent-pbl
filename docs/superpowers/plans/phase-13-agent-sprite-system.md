# Phase 13: 智能体精灵系统

> **版本**: 1.0
> **日期**: 2026-03-29
> **前置任务**: Phase-10 (智能体形象配置器), Phase-12 (智能体选择 UI)
> **技术栈**: PixiJS 8.1, TypeScript, Next.js 14

---

## 概述

Phase-13 构建完整的智能体精灵系统，为 5 种 AI 智能体类型创建视觉化的游戏场景 representation。每个智能体类型都有独特的精灵外观、状态指示器、动画效果和对话气泡。

### 5 种智能体类型

| 类型 | 角色 | 外观特征 | 颜色主题 |
|------|------|----------|----------|
| **Mentor (导师)** | 学习导师 | 学者帽、眼镜、书本 | 深蓝色 (#1e40af) |
| **Analyst (分析师)** | 数据分析师 | 笔记本电脑、图表 | 绿色 (#059669) |
| **Designer (设计师)** | UI/UX 设计师 | 调色板、画笔 | 紫色 (#7c3aed) |
| **Marketer (市场)** | 市场营销专家 | 扩音器、公文包 | 橙色 (#ea580c) |
| **Assistant (助手)** | 通用助手 | 多功能工具包 | 青色 (#0891b2) |

---

## 任务清单

### Task 1: 创建智能体精灵基础类

**文件**: `src/components/pixi/AgentSprite.ts`
**依赖**: Phase-10 的 `AgentAvatarConfig` 类型

**需求**:
1. 继承 PixiJS `AnimatedSprite` 支持多帧动画
2. 根据 `AgentAvatarConfig` 动态构建精灵外观
3. 支持 5 种智能体类型的预设配置
4. 实现基础移动动画（idle, walk, talk）
5. 导出 TypeScript 类型定义

**测试**:
- 单元测试：验证精灵类实例化
- 视觉测试：5 种类型正确渲染

---

### Task 2: 实现智能体状态可视化

**文件**: `src/components/pixi/AgentStateIndicator.ts`

**需求**:
1. 显示 3 种状态：available, busy, offline
2. 状态徽章（status badge）渲染
3. 状态变化时的过渡动画
4. 悬浮提示显示状态详情

**状态定义**:
```typescript
type AgentState = 'available' | 'busy' | 'offline'

interface AgentStateIndicatorProps {
  state: AgentState
  parentContainer: Container
  offset?: Point
}
```

---

### Task 3: 实现状态指示器和动画系统

**文件**: `src/components/pixi/AgentAnimationSystem.ts`

**需求**:
1. Idle 动画：轻微呼吸效果
2. Walk 动画：移动时的精灵帧切换
3. Talk 动画：说话时的 mouth 开合
4. Emotion 动画：happy, thinking, surprised

**动画配置**:
```typescript
interface AgentAnimation {
  type: 'idle' | 'walk' | 'talk' | 'emotion'
  frames: Texture[]
  speed: number
  loop: boolean
}
```

---

### Task 4: 实现对话气泡系统

**文件**: `src/components/pixi/SpeechBubble.ts`

**需求**:
1. 圆角矩形气泡主体
2. 指向智能体的三角形指针
3. 文本自动换行
4. 滚动支持（长文本）
5. 显示/隐藏动画

**API**:
```typescript
class SpeechBubble extends Container {
  show(text: string, duration?: number): void
  hide(): void
  update(text: string): void
}
```

---

### Task 5: 集成到游戏场景

**文件**: `src/components/pixi/AgentScene.ts`

**需求**:
1. 创建游戏场景容器
2. 管理多个智能体精灵实例
3. 处理智能体点击事件
4. 与 Phase-12 AgentSelector 集成

---

## 完成检查清单

- [ ] AgentSprite 类实现，支持 5 种类型
- [ ] AgentStateIndicator 组件
- [ ] AgentAnimationSystem 实现 4 种动画
- [ ] SpeechBubble 对话气泡
- [ ] AgentScene 场景集成
- [ ] 所有组件 Jest 测试通过
- [ ] TypeScript 编译无错误
- [ ] SERENA 验证类型定义正确

---

## 技术细节

### 精灵资源结构

```
public/sprites/agents/
├── mentor/
│   ├── idle/
│   │   ├── frame-0.png
│   │   ├── frame-1.png
│   │   └── frame-2.png
│   ├── walk/
│   └── talk/
├── analyst/
├── designer/
├── marketer/
└── assistant/
```

### 类型定义

```typescript
// src/components/pixi/types.ts
export interface AgentSpriteData {
  id: string
  type: AgentType
  config: AgentAvatarConfig
  position: { x: number; y: number }
  state: AgentState
}

export type AgentType = 'mentor' | 'analyst' | 'designer' | 'marketer' | 'assistant'
export type AgentState = 'available' | 'busy' | 'offline'
export type AgentEmotion = 'neutral' | 'happy' | 'thinking' | 'surprised'
```

---

**文档结束**
