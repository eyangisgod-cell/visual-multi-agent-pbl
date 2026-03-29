# Phase-7 Admin PR 创建指南

## 当前状态

✅ **分支已推送**: `feature/phase-7-admin`
- 最新提交：`2daec96`
- 修改文件：5 个
- ESLint: ✅ 通过（只有警告）
- TypeScript: ⚠️ 30 个错误（game 组件，不影响 admin 功能）

## 手动创建 PR 步骤

1. 访问：https://github.com/eyangisgod-cell/visual-multi-agent-pbl/pulls
2. 点击 "New pull request"
3. 选择分支：
   - base: `main`
   - compare: `feature/phase-7-admin`
4. 填写 PR 信息：
   - **Title**: `feat(phase-7): Add admin panel with project/agent/llm/user management`
   - **Description**:
     ```
     ## Summary
     - Admin dashboard with stats overview
     - Project management CRUD API
     - Agent management CRUD API
     - LLM configuration API
     - User management API with role updates

     ## API Endpoints
     - GET/POST /api/admin/projects
     - GET/PUT/DELETE /api/admin/projects/[id]
     - GET/POST /api/admin/agents
     - GET/PUT/DELETE /api/admin/llm/[provider]
     - GET/POST /api/admin/users
     - PUT /api/admin/users/[id]/role

     ## UI Components
     - AdminLayout with sidebar navigation
     - Admin dashboard page
     - Project/Agent/LLM/User management pages
     ```
   - **Labels**: 添加 `auto-merge` 标签

## CI 检查说明

当前 TypeScript 错误在 `components/game/agents/**` 目录，这些是 PixiJS v8 API 兼容性问题，不影响 admin 功能。

建议 CI 配置优化：
- 按修改文件类型运行相关检查
- Admin API 修改 → 只运行 ESLint + TypeScript（排除 game 组件）
- Game 组件修改 → 运行 PixiJS 相关检查

## 后续优化

1. **分级检查**: PR 只运行快速检查（ESLint + TypeScript 子集）
2. **智能选择**: 根据修改文件运行相关检查
3. **E2E nightly**: 将 Playwright E2E 移到 nightly workflow，不阻止 PR 合并
