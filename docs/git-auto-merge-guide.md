# Git 工作流和自动合并指南

## 当前状态

### 已推送的分支

| 分支 | 内容 | 推送时间 |
|------|------|---------|
| `main` | Phase 5 合并 + Schema 变更 + 工具脚本 | 2026-03-22 |
| `feature/phase-7-admin` | 管理后台 APIs + UI 组件 | 2026-03-22 |
| `feature/phase-8-scene-generator` | 动态场景生成器 | 2026-03-22 |

---

## 自动化工作流说明

### 1. 自动创建 PR (`create-pr-on-push.yml`)

**触发条件**：推送到 `feature/**` 分支

**执行动作**：
- 检查 PR 是否已存在
- 创建新 PR（如果不存在）
- 自动添加 `auto-merge` label
- PR 标题根据分支名自动确定

**示例**：
```bash
# 推送到 feature 分支会自动创建 PR
git push origin feature/phase-7-admin
# → GitHub Actions 自动创建 PR 并添加 auto-merge label
```

### 2. 自动合并 (`auto-merge.yml`)

**触发条件**：
- PR 有 `auto-merge` label
- CI 检查全部通过

**等待的 CI 检查**：
- `Web - ESLint & Type Check`
- `Web - Unit Tests`
- `AI Service - Pyright & Ruff`

**合并方式**：Squash merge

---

## 当前需要执行的操作

### 选项 1：等待 GitHub Actions 自动创建 PR

如果 `create-pr-on-push.yml` 工作流正常运行，PR 应该已经自动创建。

**检查步骤**：
1. 访问 https://github.com/eyangisgod-cell/visual-multi-agent-pbl/pulls
2. 查看是否有新的 PR
3. 确认 PR 有 `auto-merge` label
4. 等待 CI 检查完成

### 选项 2：手动创建 PR

如果自动创建失败，可以手动创建：

**Phase 7 PR**：
```
https://github.com/eyangisgod-cell/visual-multi-agent-pbl/compare/main...feature/phase-7-admin?expand=1
```

**Phase 8 PR**：
```
https://github.com/eyangisgod-cell/visual-multi-agent-pbl/compare/main...feature/phase-8-scene-generator?expand=1
```

**手动添加 `auto-merge` label** 后，CI 通过会自动合并。

### 选项 3：使用脚本创建 PR

如果有 GitHub CLI (`gh`) 安装：

```bash
# 在本地运行
cd E:/my-project/visual-multi-agent-pbl
bash scripts/create-prs-for-feature-branches.sh
```

---

## 推荐的开发流程

### 日常开发

```bash
# 1. 在 worktree 中开发
cd .worktrees/phase-7
# ... 编写代码 ...

# 2. 提交更改
git add -A
git commit -m "feat(phase-7): add new feature"

# 3. 推送到远程
git push origin feature/phase-7-admin

# → 自动触发：创建/更新 PR
# → 自动触发：运行 CI
# → 自动触发：CI 通过后合并到 main
```

### 查看合并状态

```bash
# 查看所有分支的推送状态
git push --all origin --dry-run

# 查看待合并的 PR
gh pr list --state open
```

---

## 故障排除

### PR 没有自动创建

**原因**：`create-pr-on-push.yml` 工作流可能未触发

**解决方案**：
1. 检查 GitHub Actions 页面
2. 手动触发工作流运行
3. 或手动创建 PR

### CI 检查失败

**原因**：代码有错误（ESLint、TypeScript、测试失败）

**解决方案**：
1. 查看失败的检查详情
2. 修复代码问题
3. 重新推送触发新的检查

### 合并冲突

**原因**：多个分支修改了相同文件

**解决方案**：
```bash
# 在 worktree 中解决冲突
cd .worktrees/phase-7
git fetch origin
git merge origin/main
# 解决冲突后
git add -A
git commit -m "fix: resolve merge conflicts"
git push
```

---

## 关于直接向 main 分支的推送

**注意**：直接向 main 分支推送会绕过代码审查和 CI 检查。

**推荐做法**：
1. 所有更改通过 feature 分支
2. 通过 PR 进行代码审查
3. CI 检查通过后自动合并

**例外情况**：
- 紧急修复
- 文档更新
- 配置变更

---

## 相关脚本

| 脚本 | 用途 |
|------|------|
| `scripts/auto-commit-worktrees.sh` | 定时检查并提交所有 worktrees |
| `scripts/check-merge-conflicts.sh` | 检测合并冲突 |
| `scripts/create-prs-for-feature-branches.sh` | 为 feature 分支创建 PR |

---

## 联系方式

如有问题，请在项目中创建 Issue 或联系开发团队。
