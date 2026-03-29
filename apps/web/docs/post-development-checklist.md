# 开发后检查清单

**更新日期**: 2026-03-29
**分支**: feature/phase-9-agent-memory

---

## 检查项目

### 代码质量
- [x] TypeScript 编译通过（Phase-10 新增文件无错误）
- [x] Jest 测试通过（15/15 测试）
- [x] SERENA 符号验证通过
- [ ] GitHub CI 检查（需要 gh auth login）

### Git 工作流
- [x] 提交信息规范（feat/docs 前缀）
- [x] 分支已推送到远程
- [ ] PR 创建（需要 GitHub 登录）
- [x] 无敏感信息提交（.env 未提交）

### 文档
- [x] Phase-10 完成报告 (`docs/phase-10-avatar-configurator-report.md`)
- [x] SERENA vs grep 测试报告 (`docs/serena-vs-grep-real-test.md`)
- [x] 开发后检查清单（本文件）

### 数据库
- [x] PostgreSQL Docker 配置正确
- [x] 本地连接字符串配置 (`.env.local`)
- [ ] 数据库迁移运行（Prisma migrate）

### 环境
- [x] 开发环境变量正确
- [ ] Docker 容器运行状态
- [ ] 服务健康检查

---

## 下次开发前检查

1. **拉取最新代码**:
   ```bash
   git checkout main
   git pull origin main
   git checkout feature/phase-9-agent-memory
   git rebase main  # 如有需要
   ```

2. **检查依赖**:
   ```bash
   npm install  # 如有 package.json 变更
   ```

3. **运行测试**:
   ```bash
   npm test
   ```

4. **检查编译**:
   ```bash
   npm run build  # 或 npx tsc --noEmit
   ```

---

## 已知问题

1. **Button.tsx vs button.tsx**: 文件大小写不一致警告
   - 文件：`src/components/ui/button.tsx` vs `Button.tsx`
   - 影响：TypeScript 编译警告
   - 解决：统一使用 `Button.tsx`（已在多个文件引用）

2. **LSP 服务器错误**: 有时 LSP 无法连接
   - 影响：无法使用 goToDefinition
   - 解决：重启编辑器或使用 SERENA/grep

3. **PWA 构建错误**: next-pwa 与 Next.js 14 兼容性问题
   - 影响：生产构建失败
   - 状态：开发环境已禁用 PWA

---

## 工具使用指南

### 快速参考

| 任务 | 推荐工具 | 命令/方法 |
|------|---------|----------|
| 查找定义 | SERENA | `find_symbol` |
| 查找引用 | SERENA | `find_referencing_symbols` |
| 文本搜索 | grep | `grep -r "pattern" src/` |
| 类型检查 | TypeScript | `npx tsc --noEmit` |
| 运行测试 | Jest | `npm test` |
| 代码格式化 | Prettier | `npx prettier --write .` |

### SERENA 使用场景

```
✅ 适合：
- 查找符号定义（接口、函数、组件）
- 追踪类型引用
- 跨文件符号导航
- 理解代码结构

❌ 不适合：
- 简单文本搜索（用 grep）
- 正则表达式匹配（用 grep）
- 非代码文件搜索
```

---

**最后验证**: 2026-03-29
**验证者**: Claude Code
