# 可视项目式学习平台 (Visual PBL Platform)

> 🎓 面向 K12 学生的多智能体游戏化项目式学习平台

**版本**: 0.1.0 (设计阶段)
**创建日期**: 2026-03-21
**状态**: 📐 设计完成，待开发

---

## 📖 项目简介

这是一个面向 K12 学生的**项目式学习（PBL）SaaS 平台**，通过游戏化界面和多智能体协作，激发学生内驱力，培养未来核心能力。

### 核心理念

- **学生扮演 CEO** - 调度不同智能体完成任务，培养决策判断能力
- **游戏化体验** - 像素风虚拟世界，智能体可视化互动
- **项目式学习** - 结合学科知识解决真实问题
- **多智能体协作** - 导师/设计师/分析师/运营师等角色配合

### 核心价值

| 问题 | 解决方案 |
|------|----------|
| 学生对学习没兴趣 | 游戏化 + 角色扮演激发成就感 |
| 缺乏自驱力 | 任务闯关 + 作品 PK + 积分激励 |
| 被动学习 | 学生主动调度智能体，培养决策能力 |
| 知识脱离实际 | 项目式学习，解决真实问题 |

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    可视项目式学习平台                            │
├─────────────────────────────────────────────────────────────────┤
│  前端：Next.js 14 + PixiJS 8 + TypeScript                      │
│  后端：Next.js API Routes + FastAPI + AG2                      │
│  数据：PostgreSQL 16 + pgvector + Redis 7                      │
│  存储：MinIO (本地) → 阿里云 OSS (生产)                         │
│  部署：Docker Compose → 阿里云 ACK                             │
└─────────────────────────────────────────────────────────────────┘
```

### 架构演进路线

| 阶段 | 部署方式 | 目标用户 | 成本估算 |
|------|----------|----------|----------|
| **阶段 1 (MVP)** | Docker Compose 本地 | <1000 | ~0 元 |
| **阶段 2 (验证)** | 云服务器单机 Docker | <10 万 | ~1000 元/月 |
| **阶段 3 (增长)** | 阿里云 ACK 托管 K8s | >100 万 | ~10000 元/月+ |

---

## 📁 文档目录

### 设计文档

| 文档 | 说明 | 路径 |
|------|------|------|
| **系统设计文档** | 完整的功能设计、技术栈选型、架构设计 | [`docs/superpowers/2026-03-21-visual-pbl-platform-design.md`](./docs/superpowers/2026-03-21-visual-pbl-platform-design.md) |
| **技术架构详解** | 架构演进路线、部署配置、数据流设计 | [`docs/superpowers/2026-03-21-technical-architecture.md`](./docs/superpowers/2026-03-21-technical-architecture.md) |
| **设计决策记录** | 12 个关键架构决策的背景和理由 (ADR) | [`docs/superpowers/2026-03-21-architecture-decisions.md`](./docs/superpowers/2026-03-21-architecture-decisions.md) |
| **待解决问题** | 技术风险、产品问题、合规问题跟踪清单 | [`docs/superpowers/2026-03-21-pending-issues.md`](./docs/superpowers/2026-03-21-pending-issues.md) |

### 快速导航

- 🎯 [系统设计概览](./docs/superpowers/2026-03-21-visual-pbl-platform-design.md) - 了解完整功能和技术栈
- 🏛️ [技术架构详解](./docs/superpowers/2026-03-21-technical-architecture.md) - 查看部署架构和配置
- 📝 [设计决策记录](./docs/superpowers/2026-03-21-architecture-decisions.md) - 理解为什么这样选择
- ⚠️ [待解决问题](./docs/superpowers/2026-03-21-pending-issues.md) - 了解风险和挑战

---

## 🎯 核心功能

### 学生端

- **任务选择** - 按年级/类型筛选，闯关模式
- **游戏化界面** - 像素风虚拟世界，智能体可视化
- **智能体调度** - 导师/设计师/分析师等角色协作
- **对话系统** - 气泡对话框 + 右侧历史面板
- **作品系统** - 生成作品并分享到微信
- **个人中心** - 作品集、积分等级、能力雷达图

### 管理后台

- **项目管理** - 上传任务、AI 辅助生成
- **RAG 知识库** - 学科知识上传、语义检索
- **智能体配置** - 人格定义、技能绑定
- **内容审核** - AI 初审 + 人工复审
- **数据分析** - 用户活跃、任务完成率、付费转化

---

## 🛠️ 技术栈

### 前端

| 组件 | 技术选型 |
|------|----------|
| 框架 | Next.js 14 (App Router + SSR) |
| 渲染引擎 | PixiJS 8 (WebGL 2D) |
| 语言 | TypeScript 5.x |
| 状态管理 | Zustand 4.x |
| UI 组件 | shadcn/ui + Tailwind CSS |
| 动画 | Framer Motion 10.x |
| WebSocket | Socket.IO 4.x |
| PWA | next-pwa |

### 后端

| 组件 | 技术选型 |
|------|----------|
| API 框架 | Next.js API Routes + FastAPI |
| Agent 框架 | AG2 (AgentScope) |
| RAG 框架 | LangChain + LlamaIndex |
| 向量模型 | BGE-M3 / text2vec |
| ORM | Prisma 5.x |
| 缓存 | Redis 7 + ioredis |
| 队列 | BullMQ 4.x |

### 数据库

| 数据库 | 用途 |
|--------|------|
| PostgreSQL 16 + pgvector | 核心业务 + 向量检索 |
| Redis 7 | 缓存/会话/排行榜 |
| MinIO / 阿里云 OSS | 对象存储 |

---

## 📋 MVP 范围（Phase 1）

### 核心功能（P0）

| 模块 | 功能 | 验收标准 |
|------|------|----------|
| 用户体系 | 用户名/密码 + 昵称 + 邀请码登录 | 可注册、登录、登出 |
| 游戏界面 | 像素风场景 + 智能体移动 + 气泡对话 | 帧率≥30fps（PC），≥24fps（移动） |
| 智能体 | 预设 5 角色 | 导师/设计师/分析师/运营师/CEO 助手 |
| 项目任务 | 3 个示例项目 | 几何教具/环保方案/历史人物对话 |
| 对话系统 | 气泡 + 右侧历史面板 | 可滚动查看历史，@提及 |
| 基础作品 | 文本/图片生成 + 本地保存 | 可导出分享 |

### 延后功能（P1+）

- 微信/QQ 登录
- 作品广场
- 积分等级系统
- 智能体创建
- 付费订阅
- 管理后台

---

## ⚠️ 待解决问题

### 技术风险

| 问题 | 影响 | 缓解措施 |
|------|------|----------|
| AG2 框架成熟度 | 高 | 预留 AutoGen 备选 |
| PixiJS 移动端性能 | 中 | 降级策略（低帧率模式） |
| LLM 响应延迟 | 高 | 流式输出 + 缓存 + 预生成 |
| WebSocket 移动端断线 | 中 | 自动重连 + 状态同步 |

### 产品问题

- 智能体创建门槛设计
- 作品审核标准
- 闯关难度曲线
- 积分通胀风险
- 家长付费意愿验证

### 合规问题

- K12 数据隐私保护
- 内容安全合规
- 面向未成年人付费合规
- 算法备案要求

详见：[待解决问题清单](./docs/superpowers/2026-03-21-pending-issues.md)

---

## 🚀 下一步行动

1. **调用 `superpowers:writing-plans`** - 生成详细实施计划
2. **Phase 1 开发** - 按 MVP 范围迭代
3. **每周用户测试** - 收集 K12 学生反馈
4. **数据驱动优化** - 根据使用数据调整功能

---

## 📚 参考资源

### 开源项目

| 项目 | URL | 可借鉴点 |
|------|-----|----------|
| **ai-town** | https://github.com/a16z-infra/ai-town | 游戏化界面、智能体可视化 |
| **AG2** | https://github.com/ag2ai/ag2 | 多智能体编排、Group Chat |
| **AG2 Playground** | https://playground.ag2.ai/ | 智能体调试界面 |

### 技术文档

- [AG2 Group Chat 文档](https://docs.ag2.ai/latest/docs/user-guide/advanced-concepts/orchestration/group-chat/introduction/)
- [PixiJS 文档](https://pixijs.com/guides/)
- [Next.js 文档](https://nextjs.org/docs)
- [pgvector 文档](https://github.com/pgvector/pgvector)

---

## 📄 许可证

本项目采用 MIT 许可证。

---

**最后更新**: 2026-03-21
