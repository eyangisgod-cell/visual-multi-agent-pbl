# CI/CD 快速参考指南

## 📋 检查清单

### 提交前（本地）

```bash
# 1. 运行 pre-commit（自动触发）
git commit -m "feat: add new feature"

# 2. 可选：运行完整本地 CI 检查
bash scripts/local-ci-check.sh           # 快速检查
bash scripts/local-ci-check.sh --full    # 完整检查（含 E2E 和 Docker）
```

### 提交后（GitHub）

```bash
# 1. 查看 CI 状态
bash scripts/check-github-ci.sh

# 2. 查看所有 PR 的 CI 状态
bash scripts/check-github-ci.sh --all

# 3. 查看失败日志
bash scripts/check-github-ci.sh --logs

# 4. 获取修复建议
bash scripts/check-github-ci.sh --fix
```

---

## 🔧 常见问题快速修复

### ESLint 失败

```bash
cd apps/web
npm run lint:fix
git add -A
git commit -m "fix: resolve ESLint errors"
git push
```

### TypeScript 失败

```bash
cd apps/web
# 查看具体错误
npx tsc --noEmit

# 手动修复类型错误后
git add -A
git commit -m "fix: resolve TypeScript errors"
git push
```

### 单元测试失败

```bash
cd apps/web
# 运行测试查看详细错误
npm test

# 如果是快照过期
npm test -- -u

# 修复代码后
git add -A
git commit -m "test: fix failing tests"
git push
```

### Ruff 失败（Python）

```bash
cd apps/ai-service
ruff check --fix .
git add -A
git commit -m "fix: resolve Ruff errors"
git push
```

### Pyright 失败（Python 类型）

```bash
cd apps/ai-service
# 查看具体错误
pyright

# 添加类型注解后
git add -A
git commit -m "fix: resolve Pyright errors"
git push
```

---

## 📊 CI 检查项对比

| 检查项 | Pre-commit | 本地 CI | GitHub CI | 耗时 |
|--------|-----------|--------|-----------|------|
| ESLint | ✅ | ✅ | ✅ | ~30s |
| TypeScript | ✅ | ✅ | ✅ | ~1m |
| 单元测试 | ✅ (相关) | ✅ (完整) | ✅ (完整) | ~2m |
| E2E 测试 | ❌ | ⚠️ (可选) | ✅ | ~5m |
| Ruff | ❌ | ✅ | ✅ | ~20s |
| Pyright | ❌ | ✅ | ✅ | ~1m |
| Pytest | ❌ | ✅ | ✅ | ~3m |
| Docker 构建 | ❌ | ⚠️ (可选) | ✅ | ~3m |
| 安全扫描 | ❌ | ❌ | ✅ | ~1m |

**图例**：
- ✅ = 运行
- ❌ = 不运行
- ⚠️ = 可选/条件运行

---

## 🎯 确保 CI 通过的流程

### 标准流程（推荐）

```bash
# 1. 开发完成后
git add .
git commit -m "feat: add new feature"
# Pre-commit 自动运行：
# - ESLint (警告)
# - TypeScript (必须通过)
# - 相关单元测试 (必须通过)

# 2. 推送前（可选但推荐）
bash scripts/local-ci-check.sh

# 3. 推送
git push origin feature/your-branch

# 4. 查看 CI 状态
bash scripts/check-github-ci.sh

# 5. 如果失败，根据提示修复
bash scripts/check-github-ci.sh --logs
bash scripts/check-github-ci.sh --fix
```

### 紧急流程（不推荐）

```bash
# 跳过 pre-commit（仅限紧急情况）
git commit -m "fix: urgent fix" --no-verify

# 立即修复并重新提交
bash scripts/local-ci-check.sh
git commit --amend
git push --force
```

---

## 🛠️ 工具安装

### GitHub CLI

```bash
# Windows (PowerShell)
winget install GitHub.cli

# 验证安装
gh --version

# 认证
gh auth login
```

### Python 工具

```bash
# 安装后端检查工具
pip install ruff pyright pytest pytest-cov pytest-asyncio
```

### Node.js 工具

```bash
# 前端已包含所有必要工具
cd apps/web
npm install
```

---

## 📖 相关文档

| 文档 | 说明 |
|------|------|
| [`CI_CD_DETAILED_ANALYSIS.md`](file://e:\my-project\visual-multi-agent-pbl\docs\CI_CD_DETAILED_ANALYSIS.md) | 详细 CI/CD 流程分析 |
| [`PRE_COMMIT_SETUP.md`](file://e:\my-project\visual-multi-agent-pbl\docs\testing\PRE_COMMIT_SETUP.md) | Pre-commit 配置说明 |
| [`pre-commit-testing.md`](file://e:\my-project\visual-multi-agent-pbl\docs\testing\pre-commit-testing.md) | 测试自动化配置 |
| [`parallel-development-spec.md`](file://e:\my-project\visual-multi-agent-pbl\docs\parallel-development-spec.md) | 并行开发规范 |

---

## 🚀 脚本用法

### local-ci-check.sh

```bash
# 快速检查（推荐）
bash scripts/local-ci-check.sh

# 完整检查（含 E2E 和 Docker）
bash scripts/local-ci-check.sh --full

# 查看帮助
bash scripts/local-ci-check.sh --help
```

### check-github-ci.sh

```bash
# 查看当前分支 CI 状态
bash scripts/check-github-ci.sh

# 查看所有 PR 的 CI 状态
bash scripts/check-github-ci.sh --all

# 查看失败日志
bash scripts/check-github-ci.sh --logs

# 获取修复建议
bash scripts/check-github-ci.sh --fix

# 查看帮助
bash scripts/check-github-ci.sh --help
```

---

## ⚡ 快速故障排查

### CI 失败但不确定原因

```bash
# 1. 查看失败日志
bash scripts/check-github-ci.sh --logs

# 2. 获取修复建议
bash scripts/check-github-ci.sh --fix

# 3. 本地运行检查
bash scripts/local-ci-check.sh
```

### Pre-commit 通过但 CI 失败

**可能原因**：
- E2E 测试失败（本地未运行）
- Docker 构建失败（本地未测试）
- 后端检查失败（本地未运行）
- 安全扫描发现漏洞

**解决方案**：
```bash
# 运行完整本地检查
bash scripts/local-ci-check.sh --full

# 查看具体失败原因
bash scripts/check-github-ci.sh --logs
```

### CI 长时间不完成

**可能原因**：
- GitHub Actions 队列拥堵
- 测试超时
- 资源不足

**解决方案**：
```bash
# 查看运行状态
gh run list --branch <your-branch>

# 查看详细日志
gh run view <run-id> --log

# 重新运行失败的 job
gh run rerun <run-id> --failed
```

---

## 💡 最佳实践

### ✅ 应该做的

1. **保持 pre-commit 与 CI 一致**
   - Pre-commit 包含核心检查项
   - 定期更新 hook 配置

2. **小步提交，频繁推送**
   - 每次只修改少量代码
   - 频繁推送，尽早发现 CI 问题

3. **使用自动修复工具**
   ```bash
   # 前端
   npm run lint:fix
   
   # 后端
   ruff check --fix .
   ruff format .
   ```

4. **定期同步 main 分支**
   ```bash
   git checkout main
   git pull origin main
   git checkout feature/your-branch
   git merge main
   ```

### ❌ 不应该做的

1. **不要跳过所有检查**
   ```bash
   # 避免使用（除非真正紧急）
   git commit --no-verify
   ```

2. **不要等到最后才运行 CI**
   - 频繁推送，不要累积大量更改

3. **不要忽略本地测试**
   - 本地测试通过再推送

4. **不要盲目重试 CI**
   - 先查看失败原因，修复后再重试

---

## 📞 需要帮助？

### 查看文档

```bash
# 完整 CI/CD 分析
cat docs/CI_CD_DETAILED_ANALYSIS.md

# Pre-commit 配置
cat docs/testing/PRE_COMMIT_SETUP.md
```

### 使用帮助命令

```bash
bash scripts/local-ci-check.sh --help
bash scripts/check-github-ci.sh --help
```

### 查看 GitHub Actions 日志

```bash
# 访问 GitHub Actions 页面
https://github.com/<owner>/<repo>/actions

# 或使用 CLI
gh run list
gh run view <run-id> --log
```

---

**最后更新**: 2026-03-23
**维护者**: Development Team
