# Visual PBL 开发流程规范

**版本**: 1.0
**日期**: 2026-03-23
**适用阶段**: MVP 开发 → v1.0 → 生产化

---

## 一、分阶段开发流程

### 阶段划分

| 阶段 | 目标 | 时间 | 质量标准 |
|------|------|------|----------|
| **Phase 1: MVP 开发** | 功能完整 | 当前 - v1.0 | 快速迭代，CI 只检查类型 |
| **Phase 2: 稳定化** | 质量基线 | v1.0 发布前 | 0 编译错误，核心测试覆盖 |
| **Phase 3: 规范化** | 生产就绪 | v1.0 之后 | 完整 CI，Code Review |

---

## 二、Phase 1: MVP 开发阶段（当前）

### 2.1 开发流程

```bash
# 1. 本地开发（跳过 pre-commit 检查）
git add -A
git commit -m "feat(phase-X): 功能描述" --no-verify

# 2. 推送到 feature 分支
git push -u origin feature/phase-x-xxx

# 3. CI 自动运行（快速检查）
#    - TypeScript: 只检查修改文件（~2 分钟）
#    - ESLint: 只检查修改文件（~1 分钟）
#    - 单元测试：跳过
#    - E2E 测试：跳过

# 4. 功能完成后创建 PR
gh pr create --title "feat(phase-x): 功能描述" --body "MVP 开发阶段"
```

### 2.2 合并规则

| 检查项 | 要求 | 说明 |
|--------|------|------|
| TypeScript | ✅ 必须通过 | 只检查修改文件 |
| ESLint | ⚠️ 警告可接受 | 不影响功能 |
| 单元测试 | ⏭️ 跳过 | MVP 阶段不强制 |
| E2E 测试 | ⏭️ 跳过 | MVP 阶段不强制 |
| Code Review | ⏭️ 可选 | 功能正确即可 |

### 2.3 退出条件

完成以下功能后进入 Phase 2：

- [ ] Phase 7: 管理后台 CRUD 完成
- [ ] Phase 8: 动态场景生成完成
- [ ] Phase 9: 智能体记忆系统完成
- [ ] Phase 10: 形象配置器完成
- [ ] Phase 11: PWA 配置完成

---

## 三、Phase 2: 稳定化阶段（v1.0 发布前）

### 3.1 创建稳定化分支

```bash
# 基于最新 main 创建修复分支
git checkout main
git checkout -b fix/stabilization-v1

# 合并所有 feature 分支
git merge feature/phase-7-admin
git merge feature/phase-8-scene-generator
git merge feature/phase-9-memory
git merge feature/phase-10-configurator
git merge feature/phase-11-pwa
```

### 3.2 运行完整检查

```bash
# 本地运行完整 CI 检查
bash scripts/local-ci-check.sh --full

# 或推送后查看 GitHub CI 状态
git push origin fix/stabilization-v1
gh run watch
```

### 3.3 修复优先级

| 优先级 | 问题类型 | 目标 |
|--------|----------|------|
| P0 | TypeScript 编译错误 | 0 错误 |
| P1 | 运行时错误 | 0 错误 |
| P2 | ESLint 严重错误 | 0 错误 |
| P3 | ESLint 警告 | < 50 个 |
| P4 | 单元测试缺失 | 核心功能覆盖 > 50% |

### 3.4 退出条件

- [ ] TypeScript 编译 0 错误
- [ ] ESLint 0 严重错误
- [ ] 核心功能单元测试覆盖 > 50%
- [ ] E2E 关键路径通过（登录 → 创建项目 → 分配任务）
- [ ] v1.0.0 版本发布

---

## 四、Phase 3: 规范化阶段（v1.0 之后）

### 4.1 开发流程

```bash
# 1. 本地开发（pre-commit 自动检查）
git add -A
git commit -m "type: 描述"
# 自动运行：
#   - ESLint 自动修复
#   - TypeScript 检查（警告不阻止）
#   - Prettier 格式化

# 2. 推送前检查（必须）
bash scripts/quick-check.sh

# 3. 推送到 feature 分支
git push -u origin feature/xxx

# 4. CI 自动运行（标准检查）
#    - TypeScript: 全部文件（~3 分钟）
#    - ESLint: 全部文件（~2 分钟）
#    - 单元测试：必须通过（~5 分钟）
#    - E2E: 关键路径（~10 分钟，非阻止）

# 5. 创建 PR
gh pr create \
  --title "type(scope): 描述" \
  --body "Fixes #XXX" \
  --label "auto-merge"
```

### 4.2 提交信息规范

```
type(scope): description

[optional body]

[optional footer]
```

**type 类型：**
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构（不添加功能）
- `test`: 测试相关
- `chore`: 构建/工具配置

**scope 范围：**
- `web`: 前端
- `ai`: 后端
- `db`: 数据库
- `ci`: CI/CD
- `deps`: 依赖

### 4.3 合并规则

| 检查项 | 要求 | 说明 |
|--------|------|------|
| TypeScript | ✅ 0 错误 | 全部文件 |
| ESLint | ✅ 0 错误 | 全部文件 |
| 单元测试 | ✅ 必须通过 | 覆盖率不降低 |
| E2E 测试 | ⚠️ 关键路径 | 非阻止但需审查 |
| Code Review | ✅ 至少 1 人 | 不能是作者自己 |

### 4.4 PR 审查清单

```markdown
## Code Review Checklist

- [ ] 代码逻辑正确
- [ ] 类型定义完整
- [ ] 错误处理完善
- [ ] 无敏感信息（密码、密钥）
- [ ] 添加必要注释
- [ ] 单元测试覆盖
- [ ] 文档已更新
```

---

## 五、快速参考

### 5.1 常用命令

```bash
# Phase 1: MVP 开发
git commit --no-verify -m "feat: xxx"
git push origin feature/xxx

# Phase 3: 规范化开发
bash scripts/quick-check.sh    # 推送前检查
npm run lint:fix               # 修复 ESLint
npx tsc --noEmit               # 检查类型

# 所有阶段
gh run watch                   # 查看 CI 状态
gh pr create                   # 创建 PR
gh pr merge <number> --merge   # 合并 PR
```

### 5.2 CI 检查时间

| 阶段 | 检查类型 | 耗时 |
|------|----------|------|
| Phase 1 | 快速检查 | ~3 分钟 |
| Phase 2 | 完整检查 | ~20 分钟 |
| Phase 3 | 标准检查 | ~8 分钟 |

### 5.3 环境配置

```bash
# 本地开发环境（推荐 Docker）
bash scripts/dev-docker.sh

# 验证环境
bash scripts/verify-env.sh
```

---

## 六、常见问题

### Q1: 为什么 MVP 阶段可以跳过测试？

**A**: 快速验证功能比完美代码更重要。但这不是不写测试的借口：
- MVP 阶段：功能优先，测试可后补
- 稳定化：必须补充核心测试
- 规范化：测试覆盖率不能降低

### Q2: 技术债务如何处理？

**A**: 每个阶段都有明确的退出条件：
- Phase 1 → Phase 2: 必须修复所有编译错误
- Phase 2 → Phase 3: 必须建立质量基线
- Phase 3: 不允许新增技术债务

### Q3: 紧急 Bug 修复怎么办？

**A**: 走快速通道：
```bash
# 创建 hotfix 分支
git checkout -b hotfix/xxx main

# 修复后直接推送到 main（跳过部分检查）
git push origin hotfix/xxx:main

# 事后补充测试和文档
```

---

## 七、总结

| 维度 | Phase 1 (MVP) | Phase 2 (稳定) | Phase 3 (规范) |
|------|---------------|----------------|----------------|
| 目标 | 功能完整 | 质量基线 | 生产就绪 |
| 速度 | 最快 | 中等 | 稳健 |
| 质量 | 警告可接受 | 0 编译错误 | 完整测试 |
| 适用 | 当前阶段 | v1.0 前 | v1.0 后 |

**当前阶段：Phase 1 (MVP 开发)**

下一步：完成 Phase 7-11 功能开发 → 进入 Phase 2 稳定化
