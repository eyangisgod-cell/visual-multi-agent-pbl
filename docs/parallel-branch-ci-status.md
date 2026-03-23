# 并行开发分支编译和检查报告

**日期**: 2026-03-22
**分析范围**: 所有 feature 分支

---

## 一、分支状态总览

| 分支 |  commits ahead of main | 修改文件数 | 本地编译 | CI 状态 | 可合并 |
|------|----------------------|----------|---------|--------|-------|
| `feature/phase-2-pixijs` | 0 (已合并) | - | ✅ | ✅ | ✅ |
| `feature/phase-7-admin` | 3 | 12 | ❓ | ❓ | ❓ |
| `feature/phase-8-scene-generator` | 6 | 22 | ❌ 45 错误 | ❌ | ❌ |
| `feature/phase-9-agent-memory` | 0 | 0 | N/A | N/A | N/A |
| `feature/phase-10-agent-avatar` | 0 | 0 | N/A | N/A | N/A |

---

## 二、跨模块依赖问题分析

### 2.1 问题分类

| 问题类型 | 影响文件 | 影响分支 | 修复方案 |
|---------|---------|---------|---------|
| PixiJS API 变更 | `components/game/agents/*.ts` (10 文件) | phase-8 | ✅ 已修复 (drawArc → arc) |
| 类型定义 | `types/global.d.ts` | phase-8 | 🔄 需要修改声明语法 |
| 导入路径 | `components/ui/*.tsx`, `hooks/*.ts` (8 文件) | phase-8 | ✅ 已修复 |
| 导出方式 | `components/ui/index.ts` | phase-8 | ✅ 已修复 |

### 2.2 根本原因

1. **PixiJS v8 升级**
   - 影响：`Graphics.drawArc()` 移除，需使用 `arc()`
   - 修复：批量替换 10 处调用

2. **Next.js 类型扩展**
   - 影响：`ServerContextJSONValue` 属性无法识别
   - 修复：需要在 `next-env.d.ts` 中扩展，而非单独的 `global.d.ts`

3. **模块路径规范**
   - 影响：跨目录导入使用错误相对路径
   - 修复：统一使用 `@/` 别名导入

---

## 三、CI 检查流程

### 3.1 当前 GitHub Actions 配置

```yaml
# .github/workflows/ci-cd.yml

触发条件:
  - push: [main, 'feature/**']
  - pull_request: [main]

检查项目:
  1. web-lint: ESLint + TypeScript (ubuntu-latest)
  2. web-test: Jest 单元测试
  3. web-e2e: Playwright E2E 测试
  4. ai-service-lint: Ruff + Pyright
  5. ai-service-test: Pytest (需要 PostgreSQL + Redis)
  6. docker-build: Docker 构建检查
  7. security-scan: 依赖安全扫描

合并条件:
  - 所有检查必须通过
  - 需要 auto-merge 标签
```

### 3.2 Pre-commit Hook (本地)

```bash
# apps/web/.husky/pre-commit

执行顺序:
1. npm run lint (ESLint) → 警告但不阻止
2. npx tsc --noEmit (TypeScript) → 错误则阻止提交

不执行:
- 单元测试 (npm test)
- E2E 测试 (npm run test:e2e)
```

---

## 四、分支合并策略

### 4.1 推荐流程

```bash
# 1. 同步 main 分支
git checkout main
git pull origin main

# 2. 合并 main 到 feature 分支
git checkout feature/phase-8-scene-generator
git merge main

# 3. 解决冲突后，本地编译检查
cd apps/web
npm run lint
npx tsc --noEmit

# 4. 提交并推送
git add -A
git commit -m "fix: merge main and resolve conflicts"
git push origin feature/phase-8-scene-generator

# 5. CI 通过后自动合并
# (需要 PR 有 auto-merge 标签)
```

### 4.2 各分支操作建议

#### phase-8-scene-generator

```bash
# 当前状态：有 TypeScript 错误
# 操作：修复错误后再合并

优先级:
1. 修复 ServerContextJSONValue 类型扩展
2. 修复 Container.userData 类型
3. 修复剩余类型错误
4. 推送后等待 CI 通过
5. 自动合并到 main
```

#### phase-7-admin

```bash
# 当前状态：有本地修改但未推送
# 操作：推送并创建 PR

步骤:
1. 检查本地修改
2. 本地编译检查
3. 推送到 origin
4. 创建 PR #11
5. 添加 auto-merge 标签
```

#### phase-9 / phase-10

```bash
# 当前状态：与 main 相同，无独立提交
# 操作：开始功能开发或合并分支

建议:
- 如果有功能开发，在对应 worktree 中开始
- 如果不需要独立分支，可以删除
```

---

## 五、跨模块修改规则

### 5.1 文件所有权

| 目录 | 负责 Agent | 修改权限 |
|------|-----------|---------|
| `apps/web/src/components/ui/**` | Frontend | 独占 |
| `apps/web/src/components/game/**` | PixiJS | 独占 |
| `apps/web/src/hooks/**` | Shared | 需要协调 |
| `apps/web/src/stores/**` | Shared | 需要协调 |
| `apps/ai-service/app/**` | Backend | 独占 |
| `apps/web/prisma/**` | Database | 独占 |

### 5.2 共享模块修改规则

当多个 Agent 需要修改共享目录时：

1. **事前协调** - 在 PR 描述中说明修改范围
2. **分支隔离** - 每个 Agent 使用独立分支
3. **频繁同步** - 每天至少 pull 一次 main
4. **小步提交** - 避免大规模重构

### 5.3 类型定义修改

类型定义文件 (`*.d.ts`) 修改规则：

1. **Database Agent** - 修改 `prisma/schema.prisma` 后通知 Frontend
2. **Frontend Agent** - 负责同步更新 `@types/` 定义
3. **PixiJS Agent** - 负责 Pixi 相关类型扩展

---

## 六、CI 失败自动修复

### 6.1 可自动修复的错误

| 错误类型 | 自动修复 | 脚本 |
|---------|---------|------|
| ESLint 格式 | ✅ | `npm run lint:fix` |
| Ruff 格式 | ✅ | `ruff check --fix` |
| 导入排序 | ✅ | `eslint-plugin-import` |

### 6.2 需要手动修复的错误

| 错误类型 | 自动修复 | 说明 |
|---------|---------|------|
| TypeScript 类型 | ❌ | 需要理解代码逻辑 |
| 单元测试失败 | ❌ | 需要修复业务逻辑 |
| 模块找不到 | ❌ | 需要修复导入路径 |
| API 不兼容 | ❌ | 需要更新调用代码 |

### 6.3 自动修复脚本

```bash
# scripts/fix-pr-ci.sh

# 在 worktree 中运行
cd E:/my-project/visual-multi-agent-pbl/.worktrees/phase-8
bash ../../scripts/fix-pr-ci.sh feature/phase-8-scene-generator

# 功能:
# 1. 检测 worktree 环境
# 2. 运行 ESLint auto-fix
# 3. 运行 Ruff auto-fix
# 4. 提交并推送修复
```

---

## 七、建议的改进措施

### 7.1 Pre-commit Hook 增强

```bash
# 当前配置
- npm run lint (ESLint)
- npx tsc --noEmit (TypeScript)

# 建议添加
+ npm test (单元测试)
+ npm run test:e2e (E2E 测试，可选)
```

### 7.2 TypeScript 配置优化

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "skipLibCheck": true,
    "types": ["./src/types/global.d.ts"]  // 显式包含类型定义
  },
  "exclude": [
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.spec.ts",
    "**/*.spec.tsx"
  ]
}
```

### 7.3 分支管理规则

```yaml
# .github/file-ownership.yml
ownership:
  - pattern: "apps/web/src/components/game/**"
    owner: pixijs-agent
    exclusive: true
    require_review: true

  - pattern: "apps/web/src/hooks/**"
    owner: shared
    exclusive: false
    require_coordination: true
```

---

## 八、下一步行动

### 高优先级 🔴

1. **修复 phase-8 TypeScript 错误**
   - 修改 `next-env.d.ts` 扩展 ServerContextJSONValue
   - 使用类型断言修复 Container.userData
   - 目标：CI 通过后自动合并

2. **推送 phase-7 修改**
   - 检查本地修改
   - 本地编译检查
   - 推送到 origin 并创建 PR

3. **确定 phase-9/10 方向**
   - 开始功能开发
   - 或合并分支删除

### 中优先级 🟡

4. **增强 Pre-commit Hook**
   - 添加单元测试检查
   - 配置 husky 在 main 分支全局安装

5. **创建文件所有权配置**
   - `.github/file-ownership.yml`
   - 防止跨目录冲突修改

### 低优先级 🟢

6. **文档更新**
   - 更新并行开发规范
   - 添加 CI 故障排查指南

---

**报告生成时间**: 2026-03-22 18:45
**下次更新**: 修复 phase-8 CI 错误后
