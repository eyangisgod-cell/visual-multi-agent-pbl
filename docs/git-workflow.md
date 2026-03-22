# Git Worktrees 定时提交配置

## Cron Job 设置（本地开发机器）

### Windows (Task Scheduler)

1. 打开 **Task Scheduler**
2. 创建基本任务：**Visual PBL Auto-Commit**
3. 触发器：每 30 分钟
4. 操作：启动程序
   - 程序：`C:\Program Files\Git\bin\bash.exe`
   - 参数：`-c "cd /e/my-project/visual-multi-agent-pbl && ./scripts/auto-commit-worktrees.sh"`
   - 起始位置：`E:\my-project\visual-multi-agent-pbl`

### Linux/macOS (crontab)

```bash
# 编辑 crontab
crontab -e

# 添加每 30 分钟执行
*/30 * * * * cd /path/to/visual-multi-agent-pbl && bash scripts/auto-commit-worktrees.sh >> logs/auto-commit.log 2>&1
```

---

## GitHub Actions 工作流说明

| 工作流 | 触发条件 | 功能 |
|--------|---------|------|
| `ci-cd.yml` | push, PR | 代码检查、测试、Docker 构建 |
| `auto-merge.yml` | PR 添加 `auto-merge` label | CI 通过后自动合并 |
| `create-pr-on-push.yml` | push 到 feature 分支 | 自动创建 PR |
| `conflict-check.yml` | 每天 00:00 UTC | 检测合并冲突并创建 Issue |

---

## 使用方法

### 1. 启用自动合并

在 PR 页面添加 `auto-merge` label，CI 通过后会立即合并。

### 2. 手动检查冲突

```bash
bash scripts/check-merge-conflicts.sh
```

### 3. 本地测试自动提交

```bash
# 测试运行
bash scripts/auto-commit-worktrees.sh

# 查看日志
cat logs/auto-commit.log
```

---

## 分支合并策略

### 当前分支状态

| 分支 | 阶段 | 状态 | 可合并 |
|------|------|------|--------|
| `feature/phase-0-setup` | Phase 0 | ✅ 完成 | ✅ 是 |
| `feature/phase-2-pixijs` | Phase 2 | ✅ 完成 | ✅ 是 |
| `feature/phase-3-agent-render` | Phase 3 | ✅ 完成 | ✅ 是 |
| `feature/phase-4-ag2-agents` | Phase 4 | ✅ 完成 | ✅ 是 |
| `feature/phase-5-project-tasks` | Phase 5 | ✅ 完成 | ✅ 是 |

### 建议合并顺序

```bash
# 1. 先检查冲突
bash scripts/check-merge-conflicts.sh

# 2. 合并没有冲突的分支
git checkout main
git pull origin main

# 按顺序合并
git merge feature/phase-0-setup -m "Merge phase-0: development environment"
git merge feature/phase-2-pixijs -m "Merge phase-2: PixiJS game scene"
git merge feature/phase-3-agent-render -m "Merge phase-3: AI agent rendering"
git merge feature/phase-4-ag2-agents -m "Merge phase-4: AG2 agent services"
git merge feature/phase-5-project-tasks -m "Merge phase-5: project task system"

# 3. 推送到远程
git push origin main
```

---

## 注意事项

1. **worktrees 独立提交**: 每个 worktree 有自己的 Git 历史和分支
2. **远程同步**: 确保每个 worktree 分支都推送到远程
3. **冲突解决**: 发现冲突时优先解决 main 分支冲突后再合并
4. **CI 验证**: 合并前确保所有 CI 检查通过

---

## 故障排查

### 自动提交失败

```bash
# 检查脚本权限
chmod +x scripts/auto-commit-worktrees.sh

# 检查 Git 配置
git config user.name
git config user.email

# 手动运行查看日志
bash -x scripts/auto-commit-worktrees.sh
```

### PR 未自动创建

- 检查分支命名是否匹配 `feature/**` 模式
- 查看 `.github/workflows/create-pr-on-push.yml` 日志
- 确认 `GITHUB_TOKEN` 权限足够

### 冲突检测失败

```bash
# 获取最新分支
git fetch --all

# 重新运行
bash scripts/check-merge-conflicts.sh
```
