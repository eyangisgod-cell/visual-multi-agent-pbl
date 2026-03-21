# Visual PBL 多 Agent 并行开发环境

## Git Worktrees 设置

已创建以下开发分支，每个分支使用独立的 worktree 进行隔离：

| Worktree | 分支 | 负责人/Agent | 任务 |
|----------|------|-------------|------|
| `.worktrees/phase-0` | `feature/phase-0-setup` | ✅ 完成 | 开发环境 + 用户认证系统 |
| `.worktrees/phase-2` | `feature/phase-2-pixijs` | PixiJS Agent | PixiJS 游戏场景引擎 |
| `.worktrees/phase-3` | `feature/phase-3-agent-render` | Agent Render Agent | 智能体 3D/2D 渲染系统 |
| `.worktrees/phase-4` | `feature/phase-4-ag2-agents` | AG2 Agent | AG2 智能体服务集成 |
| `.worktrees/phase-5` | `feature/phase-5-project-tasks` | Project Agent | 项目任务管理系统 |

## 切换工作区

```bash
# 进入 Phase-2 开发 PixiJS 游戏场景
cd .worktrees/phase-2

# 进入 Phase-3 开发智能体渲染
cd .worktrees/phase-3

# 进入 Phase-4 开发 AG2 智能体
cd .worktrees/phase-4

# 进入 Phase-5 开发项目任务系统
cd .worktrees/phase-5
```

## 各 Phase 任务说明

### Phase 2: PixiJS 游戏场景 (`.worktrees/phase-2`)
- [ ] 创建 PixiJS 应用初始化
- [ ] 实现像素风虚拟校园场景
- [ ] 添加角色移动和碰撞检测
- [ ] 实现场景切换和加载

### Phase 3: 智能体渲染系统 (`.worktrees/phase-3`)
- [ ] 创建智能体精灵 (sprite) 系统
- [ ] 实现 5 种 AI 代理外观 (智慧导师、创意设计师等)
- [ ] 添加智能体状态动画
- [ ] 实现智能体气泡对话框

### Phase 4: AG2 智能体服务 (`.worktrees/phase-4`)
- [ ] 集成 AG2 (原 AutoGen) 框架
- [ ] 实现 5 个 AI Agent 角色
- [ ] 创建 Agent 协作流程
- [ ] 实现 Agent-前端 WebSocket 通信

### Phase 5: 项目任务系统 (`.worktrees/phase-5`)
- [ ] 创建项目管理 API
- [ ] 实现任务拆解和分配
- [ ] 添加进度追踪功能
- [ ] 实现作品提交和评分

## 合并策略

完成每个 Phase 后，按以下顺序合并到 main 分支：

```bash
# 1. 合并 Phase-2
git checkout main
git merge feature/phase-2-pixijs

# 2. 合并 Phase-3
git merge feature/phase-3-agent-render

# 3. 合并 Phase-4
git merge feature/phase-4-ag2-agents

# 4. 合并 Phase-5
git merge feature/phase-5-project-tasks
```

## 注意事项

1. **不要同时修改同一文件** - 每个 Phase 有明确的职责范围
2. **共享代码通过 main 分支同步** - 通用工具函数先合并到 main
3. **每个 worktree 独立运行 Docker** - 避免端口冲突，使用不同端口
4. **提交信息标明 Phase** - 如 `feat(phase-2): add PixiJS canvas`

## 当前状态

- ✅ Phase 0: 开发环境 + 用户认证系统 (已完成，在 `phase-0` worktree)
- 🔄 Phase 2-5: 等待开发中 (各 worktree 已初始化)

## 快速启动命令

```bash
# 在任意 worktree 中启动开发环境
cd .worktrees/phase-2  # 或其他 phase
cd docker
docker-compose -f docker-compose.dev.yml up -d
```

访问地址:
- Web: http://localhost:3000
- AI Service: http://localhost:8000
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- MinIO: http://localhost:9000 (控制台 http://localhost:9001)
