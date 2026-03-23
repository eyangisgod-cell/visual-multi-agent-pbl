# Git 冲突和 CI 失败自动化修复指南

## 问题解答

### 1. 检测冲突后能否自动修复？

**简单冲突可以自动修复，复杂冲突需要人工：**

| 冲突类型 | 能否自动修复 | 解决方案 |
|---------|------------|---------|
| 不同文件修改 | ✅ 可以 | Git 自动合并 |
| 同文件不同位置 | ✅ 可以 | Git 自动合并 |
| 同文件同行修改 | ❌ 不可以 | 需要人工决定保留哪个 |
| 二进制文件冲突 | ❌ 不可以 | 需要人工选择 |

### 2. 能否自动获取 Issue 然后修复？

**可以，但有限制：**

```bash
# 自动修复流程脚本
1. 读取 GitHub Issue（冲突文件列表）
2. 尝试自动合并：git merge origin/main
3. 如果成功 → 推送修复
4. 如果失败 → 通知人工
```

### 3. 分支冲突后是否需要废弃？

**不需要废弃，有三种处理方式：**

| 方式 | 操作 | 适用场景 |
|------|------|---------|
| 原地修复 | `git merge origin/main` 解决冲突 | 少量冲突 |
| 创建新分支 | 基于最新 main 创建新分支，cherry-pick 提交 | 冲突严重 |
| Rebase | `git rebase origin/main` 逐提交修复 | 多提交需要整理 |

### 4. CI 失败能否自动修复？

**部分可以自动修复：**

| 错误类型 | 自动修复 | 说明 |
|---------|---------|------|
| ESLint 格式错误 | ✅ 可以 | `eslint --fix` |
| TypeScript 类型错误 | ❌ 不可以 | 需要人工修复逻辑 |
| 单元测试失败 | ❌ 不可以 | 需要人工修复逻辑 |
| Python Ruff 格式 | ✅ 可以 | `ruff --fix` |
| Python 类型错误 | ❌ 不可以 | 需要人工修复 |

### 5. 为什么本地不先跑 CI 再提交？

**建议配置 Pre-commit Hook：**

```bash
# 安装 husky（前端）
npm install -D husky
npx husky install

# 添加 pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run type-check"

# 安装 pre-commit（Python）
pip install pre-commit
pre-commit install
```

### 6. CI 成功后自动合并，本地继续修改怎么办？

**建议流程：**

```
1. CI 成功 → 自动合并到 main
2. 删除已合并的 feature 分支
3. 基于最新 main 创建新分支
4. 新分支 → 新 PR
```

---

## CI 失败自动修复脚本

### 前端 ESLint/TypeScript 修复

```bash
#!/bin/bash
# scripts/fix-ci-errors.sh

set -e

echo "=== CI 失败自动修复脚本 ==="

# 1. 获取最近的提交
LATEST_COMMIT=$(git rev-parse HEAD)

# 2. 尝试运行本地修复
echo "Running ESLint auto-fix..."
npm run lint:fix || echo "ESLint fix incomplete"

echo "Running TypeScript check..."
npm run type-check || {
    echo "TypeScript errors need manual fix"
    exit 1
}

echo "Running tests..."
npm test || {
    echo "Test failures need manual fix"
    exit 1
}

# 3. 如果有修复，重新提交
if ! git diff --quiet; then
    git add -A
    git commit -m "fix: auto-fix CI errors"
    git push
    echo "=== 修复完成，已推送 ==="
else
    echo "=== 没有需要修复的 ==="
fi
```

### 后端 Python 修复

```bash
#!/bin/bash
# scripts/fix-ci-errors-python.sh

set -e

cd apps/ai-service

echo "=== Python CI 修复 ==="

# 安装依赖
pip install ruff mypy pytest

# 自动修复格式问题
ruff check --fix . || echo "Some issues need manual fix"

# 类型检查（不自动修复）
mypy . --ignore-missing-imports || {
    echo "Type errors need manual fix"
    exit 1
}

# 测试
pytest || {
    echo "Test failures need manual fix"
    exit 1
}
```

---

## 预提交检查配置

### Husky 配置（前端）

```json
// .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_husky.sh"

cd apps/web

# 快速检查（不阻塞）
npm run lint &
npm run type-check &
wait

# 如果检查失败，警告但仍然提交
if [ $? -ne 0 ]; then
    echo "⚠️  检查未通过，建议修复后重新提交"
    exit 0  # 不阻止提交
fi
```

### Pre-commit 配置（后端）

```yaml
# apps/ai-service/.pre-commit-config.yaml
repos:
  - repo: https://github.com/charliermarsh/ruff-pre-commit
    rev: v0.1.6
    hooks:
      - id: ruff
        args: [--fix, --exit-non-zero-on-fix]
      - id: ruff-format

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.7.0
    hooks:
      - id: mypy
        args: [--ignore-missing-imports]
```

---

## 解决当前 CI 失败的 PR

### 步骤 1：拉取分支到本地

```bash
cd E:/my-project/visual-multi-agent-pbl

# 拉取 PR #10 的分支
git fetch origin feature/phase-9-agent-memory
git checkout feature/phase-9-agent-memory

# 拉取 PR #9 的分支
git fetch origin feature/phase-10-agent-avatar
git checkout feature/phase-10-agent-avatar

# 拉取 PR #8 的分支
git fetch origin feature/phase-8-scene-generator
git checkout feature/phase-8-scene-generator
```

### 步骤 2：本地运行 CI 检查

```bash
# 前端检查
cd apps/web
npm run lint
npm run type-check
npm test

# 后端检查
cd apps/ai-service
ruff check .
mypy .
pytest .
```

### 步骤 3：根据错误修复

**ESLint 错误（自动修复）：**
```bash
npm run lint:fix
```

**TypeScript 错误（手动修复）：**
```bash
# 查看错误详情
npm run type-check

# 编辑文件修复类型错误
# ...
```

**Python 格式错误（自动修复）：**
```bash
ruff check --fix .
ruff format .
```

### 步骤 4：修复后推送

```bash
git add -A
git commit -m "fix: resolve CI errors for PR #X"
git push origin <branch-name>

# CI 会自动重新运行
```

---

## 自动化脚本：一键修复 CI

创建脚本 `scripts/fix-pr-ci.sh`：

```bash
#!/bin/bash
# scripts/fix-pr-ci.sh
# 用法：bash scripts/fix-pr-ci.sh <branch-name>

set -e

BRANCH=$1

if [ -z "$BRANCH" ]; then
    echo "用法：bash scripts/fix-pr-ci.sh <branch-name>"
    exit 1
fi

echo "=== 修复 PR CI 错误 ==="
echo "分支：$BRANCH"

# 切换到分支
git checkout "$BRANCH"

# 拉取最新代码
git pull origin "$BRANCH"

# 前端修复
echo "=== 前端修复 ==="
cd apps/web
npm run lint:fix || true
npm run type-check || echo "TypeScript errors need manual fix"
cd ../..

# 后端修复
echo "=== 后端修复 ==="
cd apps/ai-service
ruff check --fix . || true
ruff format . || true
cd ../..

# 提交修复
if ! git diff --quiet; then
    git add -A
    git commit -m "fix: auto-fix CI errors in $BRANCH"
    git push origin "$BRANCH"
    echo "✅ 修复完成，已推送到 $BRANCH"
    echo "⏳ CI 将自动重新运行"
else
    echo "⚠️ 没有自动修复的内容，需要手动修复"
fi
```

---

## 建议的工作流更新

### 1. 冲突处理

```yaml
# .github/workflows/auto-fix-conflicts.yml
name: Auto-Fix Conflicts

on:
  schedule:
    - cron: '0 2 * * *'  # 每天 2AM
  workflow_dispatch:

jobs:
  detect-conflicts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Check for merge conflicts
        id: conflicts
        uses: olivierlacan/keep-a-changelog-action@v1
        with:
          base_branch: main

      - name: Create issue for conflicts
        if: steps.conflicts.outputs.has_conflicts == 'true'
        uses: peter-evans/create-issue-from-file@v4
        with:
          title: '🚨 Merge conflicts detected'
          content-filepath: .github/ISSUE_TEMPLATE/conflict-report.md
```

### 2. CI 失败通知

```yaml
# .github/workflows/ci-failure-notify.yml
name: CI Failure Notify

on:
  check_run:
    types: [completed]

jobs:
  notify-failure:
    if: github.event.check_run.conclusion == 'failure'
    runs-on: ubuntu-latest
    steps:
      - name: Comment on PR
        uses: actions/github-script@v7
        with:
          script: |
            const { check_run } = context.payload;
            const pr = context.payload.pull_request;

            await github.rest.issues.createComment({
              issue_number: pr.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `❌ CI check failed: ${check_run.name}

              ### 错误类型
              ${check_run.output.summary}

              ### 建议修复步骤
              1. 本地运行 \`npm run lint:fix\` 或 \`ruff check --fix\`
              2. 修复后推送重新触发 CI
              `
            });
```

---

## 总结

| 问题 | 当前状态 | 建议方案 |
|------|---------|---------|
| 冲突自动修复 | ❌ 不支持 | 简单冲突 Git 自动合并，复杂冲突人工 |
| CI 失败自动修复 | ⚠️ 部分支持 | 格式错误自动修复，逻辑错误人工 |
| 本地预检查 | ❌ 未配置 | 配置 husky/pre-commit |
| PR 分支管理 | ⚠️ 需要规范 | 合并后删除分支，基于 main 新建 |

---

## 下一步操作

1. **安装预提交检查**
   ```bash
   # 前端
   cd apps/web
   npm install -D husky
   npx husky install

   # 后端
   cd apps/ai-service
   pip install pre-commit
   pre-commit install
   ```

2. **修复当前 CI 失败的 PR**
   ```bash
   bash scripts/fix-pr-ci.sh feature/phase-8-scene-generator
   bash scripts/fix-pr-ci.sh feature/phase-9-agent-memory
   bash scripts/fix-pr-ci.sh feature/phase-10-agent-avatar
   ```

3. **配置自动化工作流**
   - 添加 CI 失败自动评论
   - 添加冲突检测自动创建 Issue
