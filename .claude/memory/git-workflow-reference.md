---
name: Git 工作流自动化配置
description: CI/CD 工作流自动创建 PR、自动合并、冲突检测的配置和行为
type: reference
---

## GitHub Actions 工作流行为

### create-pr-on-push.yml
- **触发**: push 到 feature/** 分支
- **行为**: 自动创建 PR 到 main，添加 auto-merge label
- **限制**: 只在推送时触发一次，如果 PR 已存在则跳过

### auto-merge.yml
- **触发**: PR 有 auto-merge label
- **等待的 CI 检查**:
  - Web - ESLint & Type Check
  - Web - Unit Tests
  - AI Service - Pyright & Ruff
- **合并方式**: squash merge

### conflict-check.yml
- **触发**: 每天 cron 运行
- **行为**: 检测合并冲突，创建 GitHub Issue

## 重要规则

**CI 失败时的行为**:
- CI 失败时不会自动合并
- 需要手动修复代码后重新推送
- 新的推送会触发新的 CI 检查

**合并冲突处理**:
- 自动检测但不自动解决
- conflict-check.yml 会创建 Issue 通知
- 需要手动解决冲突后推送

**PR 状态管理**:
- 已合并到 main 的分支，对应的 PR 会自动关闭
- 重复的 PR 应该被关闭或重新基于最新 main

**Why**: 用户询问了 PR #3, #4, #7, #8 是否需要合并，需要明确当前哪些分支已合并、哪些 pending

**How to apply**:
1. 检查 `git branch --merged main` 确认已合并分支
2. 检查 GitHub PR 页面确认状态
3. 关闭已合并分支对应的旧 PR
4. 为未合并的 feature 分支创建/保留 PR
