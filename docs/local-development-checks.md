# 本地开发检查流程

**适用阶段**: Phase 1 (MVP 开发)
**目标**: 在提交前快速检查代码质量，避免 CI 报错

---

## 🚀 快速上手

### 提交前检查（推荐）

```bash
# 1. 添加修改的文件
git add -A

# 2. 运行快速检查（只检查修改的文件）
bash scripts/quick-check.sh

# 3. 提交（pre-commit 会自动运行检查）
git commit -m "feat(phase-x): 功能描述"

# 4. 推送前运行完整检查（可选）
bash scripts/local-ci-check.sh
```

---

## 📋 检查脚本说明

### 1. `scripts/quick-check.sh` - 快速检查

**用途**: 推送前快速检查修改的文件
**耗时**: ~30 秒
**检查范围**: 仅修改的 TypeScript 文件

```bash
# 使用方法
bash scripts/quick-check.sh

# 输出示例
========================================
  快速检查（仅修改的文件）
========================================

📝 检查文件:
  - src/hooks/useAgent.ts
  - src/stores/agentStore.ts

1️⃣  TypeScript 检查（修改文件）...
✅ TypeScript 检查通过

2️⃣  ESLint 检查（修改文件）...
✅ ESLint 检查通过

========================================
  快速检查完成
========================================
```

---

### 2. `scripts/local-ci-check.sh` - 完整检查

**用途**: 推送前完整检查（模拟 GitHub CI）
**耗时**: ~2 分钟
**检查范围**: 整个项目

```bash
# 快速模式（只警告）
bash scripts/local-ci-check.sh

# 完整模式（包括测试，可选）
bash scripts/local-ci-check.sh --full
```

---

### 3. Pre-commit Hook - 自动检查

**用途**: 提交时自动运行检查
**耗时**: ~1 分钟
**阶段**: MVP 只警告不阻止

```bash
# 提交时自动运行
git commit -m "feat: xxx"

# 输出示例
=== Running pre-commit checks (MVP phase - warnings only) ===

1️⃣  Running ESLint...
✅ ESLint 检查通过

2️⃣  Running TypeScript check...
✅ TypeScript 检查通过

=== Pre-commit checks completed (warnings only) ===

✅ 预提交检查完成（MVP 阶段只警告）
```

---

## 🔧 手动运行检查

### ESLint 检查

```bash
cd apps/web

# 检查所有文件
npm run lint

# 自动修复
npm run lint:fix

# 检查指定文件
npx eslint src/hooks/useAgent.ts
```

### TypeScript 检查

```bash
cd apps/web

# 检查所有文件
npx tsc --noEmit

# 检查指定文件
npx tsc --noEmit src/hooks/useAgent.ts src/stores/agentStore.ts

# 查看完整错误（前 50 行）
npx tsc --noEmit 2>&1 | head -50
```

---

## 📊 检查策略对比

| 场景 | 检查类型 | 阻止提交 | 耗时 |
|------|----------|----------|------|
| **Pre-commit** | ESLint + TypeScript | ❌ 否（MVP） | ~1 分钟 |
| **Quick Check** | 仅修改文件 | ❌ 否 | ~30 秒 |
| **Local CI** | 完整检查 | ❌ 否（MVP） | ~2 分钟 |
| **GitHub CI** | 完整检查 | ❌ 否（MVP） | ~3 分钟 |

---

## ✅ 推荐工作流

### MVP 阶段（当前）

```bash
# 1. 开发功能
# ... 编写代码 ...

# 2. 添加修改
git add -A

# 3. 运行快速检查（可选但推荐）
bash scripts/quick-check.sh

# 4. 提交（自动运行 pre-commit）
git commit -m "feat(phase-7): 添加管理后台"

# 5. 推送前运行完整检查（推荐）
bash scripts/local-ci-check.sh

# 6. 推送
git push origin feature/phase-7-admin
```

### Phase 2（稳定化阶段）

```bash
# 1. 开发功能
# ... 编写代码 ...

# 2. 添加修改
git add -A

# 3. 运行完整检查（必须）
bash scripts/local-ci-check.sh

# 4. 提交（pre-commit 会阻止错误）
git commit -m "feat(phase-x): 功能描述"

# 5. 推送
git push origin feature/phase-x
```

---

## 🛠️ 常见问题

### Q: TypeScript 错误太多，如何快速定位？

```bash
# 查看完整错误（前 50 行）
npx tsc --noEmit 2>&1 | head -50

# 只查看错误类型统计
npx tsc --noEmit 2>&1 | grep -o 'error TS[0-9]*' | sort | uniq -c
```

### Q: ESLint 如何自动修复？

```bash
cd apps/web

# 自动修复所有可修复的问题
npm run lint:fix

# 检查修复后是否还有问题
npm run lint
```

### Q: 如何跳过 pre-commit 检查？

```bash
# 紧急情况下使用 --no-verify
git commit --no-verify -m "hotfix: 紧急修复"
```

**注意**: 跳过检查后，请尽快在本地运行检查并修复问题：

```bash
bash scripts/quick-check.sh
```

---

## 📱 IDE 集成

### VS Code 自动检查和修复

在项目根目录创建 `.vscode/settings.json`：

```json
{
  "eslint.validate": [
    "typescript",
    "typescriptreact"
  ],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsc.autoEmit": "off"
}
```

### 自动格式化

安装 Prettier 插件后，配置保存时自动格式化：

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

---

## 🎯 检查清单

提交前确认：

- [ ] 快速检查通过（`bash scripts/quick-check.sh`）
- [ ] ESLint 无严重错误
- [ ] TypeScript 无严重类型错误
- [ ] 提交信息符合规范（`feat(phase-x): 描述`）
- [ ] 已推送到正确的 feature 分支

---

**当前阶段**: Phase 1 (MVP 开发)
**检查策略**: 只警告不阻止
**下一步**: Phase 2 稳定化后将启用完整检查
