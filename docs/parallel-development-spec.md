# Visual PBL 并行开发规范

> **版本**: 2.0
> **日期**: 2026-03-22
> **目的**: 规范多 Agent 并行开发，避免冲突，确保代码质量

---

## 一、子 Agent 分工规则

### 1.1 Agent 角色定义

| Agent | 职责 | 工作分支 | 负责目录 |
|-------|------|---------|---------|
| **Frontend Agent** | 前端 UI 组件开发 | `feature/phase-*-frontend` | `apps/web/src/components/**`, `apps/web/src/app/**` |
| **Backend Agent** | 后端 API 开发 | `feature/phase-*-backend` | `apps/ai-service/app/**`, `apps/web/src/app/api/**` |
| **PixiJS Agent** | 游戏/图形开发 | `feature/phase-*-pixijs` | `apps/web/src/components/game/**` |
| **Database Agent** | 数据库/Schema 开发 | `feature/phase-*-db` | `apps/web/prisma/**`, `apps/ai-service/app/db/**` |
| **DevOps Agent** | 配置/脚本开发 | `feature/phase-*-devops` | `.github/**`, `scripts/**`, `docker/**` |

### 1.2 文件所有权规则

```yaml
# .github/file-ownership.yml
ownership:
  # Frontend 独占
  - pattern: "apps/web/src/components/ui/**"
    owner: frontend-agent
    exclusive: true

  - pattern: "apps/web/src/components/game/**"
    owner: pixijs-agent
    exclusive: true

  - pattern: "apps/web/src/app/admin/**"
    owner: frontend-agent
    exclusive: true

  # Backend 独占
  - pattern: "apps/ai-service/app/api/**"
    owner: backend-agent
    exclusive: true

  # Database 独占
  - pattern: "apps/web/prisma/schema.prisma"
    owner: database-agent
    exclusive: true

  # 共享目录（需要协调）
  - pattern: "apps/web/src/hooks/**"
    owner: shared
    exclusive: false

  - pattern: "apps/web/src/stores/**"
    owner: shared
    exclusive: false
```

### 1.3 Phase 分工示例

```markdown
## Phase 9 - 智能体记忆与进化系统

| 子任务 | Agent | 分支 | 文件 |
|--------|-------|------|------|
| 记忆系统 API | Backend | `feature/phase-9-backend` | `apps/ai-service/app/api/memories.py` |
| 记忆系统 Schema | Database | `feature/phase-9-db` | `apps/web/prisma/schema.prisma` |
| 记忆系统 UI | Frontend | `feature/phase-9-frontend` | `apps/web/src/app/admin/memories/**` |

## Phase 10 - 智能体形象配置器

| 子任务 | Agent | 分支 | 文件 |
|--------|-------|------|------|
| 形象配置 API | Backend | `feature/phase-10-backend` | `apps/web/src/app/api/admin/agents/avatar/**` |
| 形象配置 UI | Frontend | `feature/phase-10-frontend` | `apps/web/src/app/admin/agents/configurator/**` |
| 形象预览组件 | PixiJS | `feature/phase-10-pixijs` | `apps/web/src/components/game/avatar/AvatarPreview.tsx` |

## Phase 11 - PWA 完整配置

| 子任务 | Agent | 分支 | 文件 |
|--------|-------|------|------|
| PWA 配置 | DevOps | `feature/phase-11-devops` | `apps/web/next.config.js`, `apps/web/public/manifest.json` |
| Service Worker | Frontend | `feature/phase-11-frontend` | `apps/web/src/service-worker/**` |
```

---

## 二、提交前自动化检查流程

### 2.1 Pre-commit Hook 配置

#### 前端 Pre-commit

```bash
#!/bin/bash
# apps/web/.husky/pre-commit

set -e

echo "=== Running Pre-commit Checks ==="

# 1. ESLint 自动修复
echo "[1/4] Running ESLint..."
npm run lint:fix

# 2. TypeScript 类型检查
echo "[2/4] Running TypeScript check..."
npx tsc --noEmit

# 3. 运行单元测试
echo "[3/4] Running tests..."
npm test -- --passWithNoTests

# 4. 格式化检查
echo "[4/4] Running Prettier check..."
npx prettier --check "src/**/*.{ts,tsx}" || {
    echo "Formatting issues found. Auto-fixing..."
    npx prettier --write "src/**/*.{ts,tsx}"
}

echo "=== All checks passed ==="
```

#### 后端 Pre-commit

```bash
#!/bin/bash
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
        args: [--ignore-missing-imports, --no-error-summary]

  - repo: local
    hooks:
      - id: pytest
        name: pytest
        entry: pytest
        language: system
        pass_filenames: false
        always_run: true
        args: [--passWithNoTests]
```

### 2.2 CI 检查流程（GitHub Actions）

```yaml
# .github/workflows/ci-check.yml
name: CI Checks

on:
  push:
    branches: [feature/**]
  pull_request:
    branches: [main]

jobs:
  # ========== 前端检查 ==========
  web-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: 'apps/web/package-lock.json'

      - name: Install dependencies
        run: cd apps/web && npm ci --legacy-peer-deps

      - name: ESLint
        run: cd apps/web && npm run lint

  web-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: cd apps/web && npm ci --legacy-peer-deps

      - name: TypeScript check
        run: cd apps/web && npx tsc --noEmit

  web-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: cd apps/web && npm ci --legacy-peer-deps

      - name: Run tests
        run: cd apps/web && npm test -- --passWithNoTests

  # ========== 后端检查 ==========
  ai-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install dependencies
        run: |
          cd apps/ai-service
          pip install -r requirements.txt

      - name: Ruff lint
        run: cd apps/ai-service && ruff check .

  ai-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          cd apps/ai-service
          pip install -r requirements.txt

      - name: Mypy check
        run: cd apps/ai-service && mypy . --ignore-missing-imports

  ai-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          cd apps/ai-service
          pip install -r requirements.txt

      - name: Run tests
        run: cd apps/ai-service && pytest --passWithNoTests
```

---

## 三、TypeScript 错误预防机制

### 3.1 为什么会出现 TypeScript 错误？

**常见原因：**

| 原因 | 说明 | 解决方案 |
|------|------|---------|
| 模块未找到 | 导入的文件不存在或路径错误 | 使用绝对路径，检查文件是否存在 |
| 类型未定义 | 函数参数/返回值缺少类型注解 | 启用严格模式，强制类型注解 |
| 类型不匹配 | 实际类型与声明类型不符 | 使用类型推断，减少手动声明 |
| 依赖缺失 | 缺少类型定义包 | 安装 `@types/*` 包 |
| 导出错误 | 默认导出 vs 命名导出混用 | 统一使用命名导出 |

### 3.2 预防措施

#### 1. 配置严格 TypeScript

```json
// apps/web/tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "skipLibCheck": true
  }
}
```

#### 2. 使用 ESLint 强制类型注解

```json
// apps/web/.eslintrc.json
{
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
}
```

#### 3. Pre-commit 自动修复

```bash
#!/bin/bash
# scripts/pre-commit-typescript.sh

set -e

cd apps/web

# 1. 自动修复 ESLint 错误
npm run lint:fix

# 2. 运行 TypeScript 检查（不阻止提交，只警告）
if ! npx tsc --noEmit; then
    echo ""
    echo "⚠️  TypeScript 错误需要手动修复"
    echo ""
    echo "错误列表："
    npx tsc --noEmit 2>&1 | grep "error TS" | head -10
    echo ""
    echo "修复后重新提交"
    exit 1
fi

echo "✅ TypeScript 检查通过"
```

### 3.3 自动修复脚本

```bash
#!/bin/bash
# scripts/auto-fix-typescript.sh
# 用法：bash scripts/auto-fix-typescript.sh <branch-name>

set -e

BRANCH=$1

echo "=== TypeScript 错误自动修复 ==="
echo "分支：$BRANCH"

# 切换到分支
git checkout "$BRANCH"

cd apps/web

# 1. 安装缺失的类型定义
echo "检查类型定义..."
npx tsc --noEmit 2>&1 | grep "@types/" | sed 's/.*Try `npm i --save-dev/@' | sort -u | while read pkg; do
    echo "安装 $pkg"
    npm install --save-dev "$pkg" 2>/dev/null || true
done

# 2. 运行 ESLint 自动修复
echo "运行 ESLint 自动修复..."
npm run lint:fix

# 3. 再次检查 TypeScript
echo "运行 TypeScript 检查..."
if npx tsc --noEmit; then
    echo "✅ TypeScript 检查通过"
else
    echo "⚠️  仍有 TypeScript 错误，需要手动修复"
fi

cd ../..

# 4. 提交修复
if ! git diff --quiet; then
    git add -A
    git commit -m "fix: auto-fix TypeScript and ESLint errors"
    git push origin "$BRANCH"
    echo "✅ 修复已推送"
fi
```

---

## 四、Superpowers 自动化检查配置

### 4.1 使用 superpowers 技能实现自动化

在 `.claude/settings.json` 中配置 hooks：

```json
{
  "hooks": {
    "before_commit": {
      "cmd": "bash scripts/pre-commit-check.sh",
      "description": "运行提交前检查"
    },
    "before_push": {
      "cmd": "bash scripts/before-push-checks.sh",
      "description": "推送前运行本地 CI"
    }
  }
}
```

### 4.2 Pre-commit Check 脚本

```bash
#!/bin/bash
# scripts/pre-commit-check.sh

set -e

echo "=== 提交前检查 ==="

# 检查当前分支
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "当前分支：$BRANCH"

# 检查是否有冲突文件
CONFLICTS=$(git diff --name-only --diff-filter=U)
if [ -n "$CONFLICTS" ]; then
    echo "❌ 存在冲突文件：$CONFLICTS"
    exit 1
fi

# 前端检查
if [ -f "apps/web/package.json" ]; then
    echo "=== 前端检查 ==="
    cd apps/web

    # ESLint
    if ! npm run lint:fix; then
        echo "❌ ESLint 修复失败"
        exit 1
    fi

    # TypeScript (只警告)
    if ! npx tsc --noEmit 2>/dev/null; then
        echo "⚠️  TypeScript 错误，请手动修复"
    fi

    cd ..
fi

# 后端检查
if [ -f "apps/ai-service/requirements.txt" ]; then
    echo "=== 后端检查 ==="
    cd apps/ai-service

    # Ruff
    if ! ruff check --fix . 2>/dev/null; then
        echo "⚠️  Ruff 检查未通过"
    fi

    cd ..
fi

echo "=== 检查完成 ==="
```

---

## 五、并行开发最佳实践

### 5.1 分支管理

```bash
# 1. 每天开始工作前
git fetch origin
git checkout main
git pull origin main

# 2. 基于最新 main 创建分支
git checkout -b feature/phase-9-frontend main

# 3. 定期同步 main 分支
git fetch origin
git merge origin/main

# 4. 完成工作后推送
git push -u origin feature/phase-9-frontend
```

### 5.2 冲突避免策略

| 策略 | 说明 |
|------|------|
| **文件隔离** | 每个 Agent 有专属目录，不修改共享文件 |
| **接口先行** | 先定义 API 接口，再并行实现 |
| **频繁同步** | 每 2 小时拉取一次 main 分支 |
| **小步提交** | 每完成一个功能点就提交 |
| **Code Owner** | 关键文件指定负责人 |

### 5.3 每日工作流程

```bash
# 早上开始工作
1. git fetch origin
2. git checkout main && git pull origin main
3. git checkout <your-branch>
4. git merge main  # 同步最新代码

# 工作期间
1. 每 30 分钟：git add -A && git commit -m "feat: xxx"
2. 每 2 小时：git push origin <branch>

# 下班前
1. git push origin <branch>
2. 检查 GitHub CI 状态
3. 如有错误，运行修复脚本
```

---

## 六、CI 失败自动修复流程

### 6.1 自动修复脚本

```bash
#!/bin/bash
# scripts/fix-all-ci-errors.sh
# 用法：bash scripts/fix-all-ci-errors.sh

set -e

echo "=== CI 错误自动修复 ==="

# 获取所有未合并的 feature 分支
BRANCHES=$(git branch -r --no-merged origin/main | grep feature | sed 's/origin\///')

for BRANCH in $BRANCHES; do
    echo ""
    echo "=== 处理分支：$BRANCH ==="

    # 检出分支
    git checkout "$BRANCH"

    # 拉取最新代码
    git pull origin "$BRANCH" || true

    # 前端修复
    if [ -f "apps/web/package.json" ]; then
        cd apps/web
        npm run lint:fix || true
        cd ../..
    fi

    # 后端修复
    if [ -f "apps/ai-service/requirements.txt" ]; then
        cd apps/ai-service
        ruff check --fix . || true
        ruff format . || true
        cd ../..
    fi

    # 提交修复
    if ! git diff --quiet; then
        git add -A
        git commit -m "fix: auto-fix CI errors in $BRANCH"
        git push origin "$BRANCH"
        echo "✅ $BRANCH 修复完成"
    else
        echo "⚠️  $BRANCH 没有自动修复的内容"
    fi
done

echo ""
echo "=== 所有分支修复完成 ==="
```

### 6.2 CI 状态检查

```bash
#!/bin/bash
# scripts/check-ci-status.sh

# 使用 GitHub CLI 检查 CI 状态
gh pr list --state open --json number,headRefName,checkRuns | jq -r '.[] | "\(.headRefName): \(.checkRuns | map(select(.conclusion == "failure")) | length) failures"'
```

---

## 七、总结

### 规则速查表

| 问题 | 解决方案 |
|------|---------|
| 分支冲突 | 文件隔离 + 频繁同步 |
| CI 失败 | pre-commit hook + 自动修复脚本 |
| TypeScript 错误 | 严格模式 + 类型定义 + 提交前检查 |
| 模块冲突 | 文件所有权规则 + Code Owner |

### 下一步行动

1. **安装 pre-commit hooks**
   ```bash
   bash scripts/install-hooks.sh
   ```

2. **配置文件所有权**
   ```bash
   # 编辑 .github/file-ownership.yml
   ```

3. **运行一次完整检查**
   ```bash
   bash scripts/fix-all-ci-errors.sh
   ```

---

**文档结束**
