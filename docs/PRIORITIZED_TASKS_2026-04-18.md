# 优先级任务拆解文档

**生成日期**: 2026-04-18  
**项目**: Visual PBL 多智能体项目式学习平台  
**分支**: main  
**方法**: TDD（测试驱动开发）

---

## 任务执行顺序

### P0 - 核心认证安全修复（立即执行）

**原因**: 用户认证缺失可能导致未授权访问

#### Task 0.1: 修复积分兑换 API 认证
- **文件**: `apps/web/src/app/api/points/redeem/route.ts:26`
- **TODO**: `实现用户认证后从 session 获取 userId`
- **测试**: 添加积分兑换 API 测试（需先登录）
- **工时**: 1 小时

#### Task 0.2: 修复作品创建 API 认证
- **文件**: `apps/web/src/app/api/works/route.ts:35`
- **TODO**: `Get user ID from session/token`
- **测试**: 添加作品创建 API 测试（需先登录）
- **工时**: 1 小时

---

### P1 - E2E 测试修复（高优先级）

**原因**: 12 个测试失败，覆盖率仅 72%

#### Task 1.1: 修复选择器匹配多元素问题
- **测试文件**: `core-business-flow.spec.ts`, `pwa-mobile.spec.ts`
- **问题**: `getByRole` 匹配多个元素导致严格模式失败
- **修复**: 使用精确匹配或 `.first()` / `.nth()` 选择器
- **测试**: 运行现有测试验证修复
- **工时**: 2 小时

#### Task 1.2: 修复游戏页面加载问题
- **测试文件**: `core-business-flow.spec.ts`
- **问题**: Canvas 元素不可见，位置显示"Loading..."
- **修复**: 检查 PixiApp 组件加载逻辑，增加等待条件
- **测试**: 运行游戏页面相关测试
- **工时**: 3 小时

#### Task 1.3: 修复用户菜单选择器
- **测试文件**: `core-business-flow.spec.ts`
- **问题**: `user-menu` 元素不可见
- **修复**: 更新首页用户菜单的实际选择器
- **测试**: 运行用户信息相关测试
- **工时**: 1 小时

#### Task 1.4: 移除重复 HTML 标签
- **文件**: `apps/web/src/app/layout.tsx`
- **问题**: manifest link 和 meta 标签重复
- **修复**: 移除手动添加的重复标签（Next.js metadata 已自动生成）
- **测试**: 运行 PWA 测试验证
- **工时**: 0.5 小时

---

### P2 - 功能完善（中优先级）

#### Task 2.1: 实现作品点赞前端功能
- **文件**: `apps/web/src/app/works/[id]/page.tsx:96`
- **TODO**: `Implement like API`
- **后端**: API 已存在 (`/api/works/[id]/like`)
- **前端**: 添加点赞按钮组件和 API 调用
- **测试**: 添加点赞功能 E2E 测试
- **工时**: 2 小时

#### Task 2.2: 集成 pgvector 向量搜索
- **文件**: `apps/web/src/app/api/knowledge/search/route.ts:8`
- **TODO**: `集成 pgvector 实现真正的向量相似度搜索`
- **依赖**: PostgreSQL pgvector 扩展
- **测试**: 添加向量搜索 API 测试
- **工时**: 4 小时

#### Task 2.3: 集成 LLM 生成回答
- **文件**: `apps/web/src/app/api/knowledge/query/route.ts:49`
- **TODO**: `集成 LLM 生成真正的回答`
- **依赖**: AI Service 或外部 LLM API
- **测试**: 添加 RAG 问答 API 测试
- **工时**: 4 小时

#### Task 2.4: 实现好友排行榜
- **文件**: `apps/web/src/app/api/points/leaderboard/route.ts:54`
- **TODO**: `实现好友排行榜逻辑，需要先实现好友关系表`
- **依赖**: 好友关系表（新数据库表）
- **测试**: 添加排行榜 API 测试
- **工时**: 4 小时

---

### P3 - 代码清理（低优先级）

#### Task 3.1: 移除或实现简化 TODO
- **文件**: `apps/web/src/app/api/admin/agents/select/route.ts:51`
- **TODO**: `For now, we just validate the agent exists`
- **行动**: 评估当前简化实现是否满足需求，或补充完整逻辑
- **工时**: 1 小时

---

## 执行计划

### 第一阶段：P0（认证安全）- 今日完成
1. Task 0.1: 积分兑换 API 认证
2. Task 0.2: 作品创建 API 认证

### 第二阶段：P1（测试修复）- 明日完成
1. Task 1.4: 移除重复标签（最快，减少干扰）
2. Task 1.1: 修复选择器问题
3. Task 1.3: 修复用户菜单选择器
4. Task 1.2: 修复游戏页面加载

### 第三阶段：P2（功能完善）- 本周完成
1. Task 2.1: 作品点赞前端
2. Task 2.2: pgvector 集成
3. Task 2.3: LLM 集成
4. Task 2.4: 好友排行榜

### 第四阶段：P3（代码清理）- 本周完成
1. Task 3.1: 评估并清理 TODO

---

## TDD 执行要求

每个任务必须遵循 TDD 流程：

```
1. RED: 先写失败测试
2. 验证测试失败（正确原因）
3. GREEN: 写最少代码通过测试
4. 验证测试通过
5. REFACTOR: 重构（保持绿色）
6. 重复下一测试
```

**禁止**:
- 先写代码后补测试
- 不验证测试失败原因
- 过度实现（YAGNI）

---

## 验收标准

### P0 验收
- [ ] 所有认证相关 TODO 已移除
- [ ] API 测试通过（需登录后访问）
- [ ] 未授权请求返回 401

### P1 验收
- [ ] `registration-login-flow.spec.ts`: 14/14 通过
- [ ] `core-business-flow.spec.ts`: 13/13 通过
- [ ] `pwa-mobile.spec.ts`: 17/17 通过
- [ ] 总体测试覆盖率 > 90%

### P2 验收
- [ ] 作品点赞功能前端可交互
- [ ] 知识库搜索支持向量相似度
- [ ] RAG 问答返回 LLM 生成回答
- [ ] 好友排行榜显示正确数据

### P3 验收
- [ ] 代码中无简化 TODO 标记
- [ ] 或 TODO 已转换为独立任务

---

## 测试执行命令

```bash
# 运行所有 E2E 测试
npx playwright test tests/e2e/

# 运行特定测试文件
npx playwright test tests/e2e/registration-login-flow.spec.ts
npx playwright test tests/e2e/core-business-flow.spec.ts
npx playwright test tests/e2e/pwa-mobile.spec.ts

# 有头模式（可视化调试）
npx playwright test --headed

# 生成 HTML 报告
npx playwright show-report
```

---

## 进度追踪

| 任务 | 优先级 | 状态 | 开始时间 | 完成时间 | 备注 |
|------|--------|------|----------|----------|------|
| Task 0.1 | P0 | ✅ 已完成 | 2026-04-18 | 2026-04-18 | 积分兑换认证 - 已添加 JWT 认证 |
| Task 0.2 | P0 | ✅ 已完成 | 2026-04-18 | 2026-04-18 | 作品创建认证 - 已添加 JWT 认证 |
| Task 1.1 | P1 | ✅ 已完成 | 2026-04-18 | 2026-04-18 | 测试选择器修复 - 增加超时时间 |
| Task 1.2 | P1 | ✅ 已完成 | 2026-04-18 | 2026-04-18 | 游戏加载超时修复 - 30 秒超时 |
| Task 1.3 | P1 | ✅ 已完成 | 2026-04-18 | 2026-04-18 | 用户菜单选择器 - 支持中英文 |
| Task 1.4 | P1 | ✅ 已完成 | - | - | 重复标签移除 - 已清理 |
| Task 2.1 | P2 | ⏳ 待执行 | - | - | 点赞前端 |
| Task 2.2 | P2 | ⏳ 待执行 | - | - | pgvector 集成 |
| Task 2.3 | P2 | ⏳ 待执行 | - | - | LLM 集成 |
| Task 2.4 | P2 | ⏳ 待执行 | - | - | 好友排行榜 |
| Task 3.1 | P3 | ⏳ 待执行 | - | - | TODO 清理 |

---

**文档版本**: 1.0  
**下次更新**: 2026-04-18 会话结束前
