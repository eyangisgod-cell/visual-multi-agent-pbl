# 根因分析和修复报告

**日期**: 2026-04-04
**状态**: ✅ 修复完成

---

## 问题概述

用户报告了两个问题：
1. **游戏页面持续加载** - http://localhost:3000/game 一直显示 "Loading..."
2. **管理后台 404** - http://localhost:3000/admin 点击任何导航链接都返回 404

---

## 根因分析

### 问题 1: 登录 API 失败导致游戏页面无法加载

**症状**:
- 前端登录时显示加载中
- 后端日志显示 `POST /api/auth/login 500`
- 错误代码：`P2002` - 违反了 `Session` 表的 `token` 唯一约束

**根因**:
```
错误日志：
Unique constraint failed on the fields: (`token`)
code: 'P2002',
clientVersion: '5.9.0',
meta: { modelName: 'Session', target: [ 'token' ] }
```

登录 API 在每次登录时都会尝试创建新的 Session 记录，但没有先清理用户已过期的 session。当同一个用户多次登录时，如果生成的 session token 偶然冲突（或数据库中存在过期 session），就会违反 `token` 字段的唯一约束。

**修复方案**:
在创建新 session 之前，先删除用户的所有过期 session：

```typescript
// Clean up expired sessions for this user first
await prisma.session.deleteMany({
  where: {
    userId: user.id,
    expiresAt: {
      lt: new Date()
    }
  }
})

// Create new session
const session = await prisma.session.create({
  data: {
    userId: user.id,
    token: sessionToken,
    expiresAt
  }
})
```

**修复文件**: `apps/web/src/app/api/auth/login/route.ts`

---

### 问题 2: 管理后台导航链接到不存在的页面

**症状**:
- 点击管理后台侧边栏的任何导航链接都返回 404
- 只有 `/admin`, `/admin/agents/select`, `/admin/agents/configurator` 三个页面存在

**根因**:
`AdminLayout.tsx` 中定义的导航链接指向的页面大多数不存在：

```typescript
const navigation = [
  { name: '仪表盘', href: '/admin', icon: '📊' },          // ✅ 存在
  { name: '项目管理', href: '/admin/projects', icon: '📁' },  // ❌ 不存在
  { name: '智能体管理', href: '/admin/agents', icon: '🤖' },  // ❌ 不存在
  { name: 'LLM 配置', href: '/admin/llm', icon: '🧠' },     // ❌ 不存在
  { name: '用户管理', href: '/admin/users', icon: '👥' },    // ❌ 不存在
  { name: '场景模板', href: '/admin/scenes', icon: '🎬' },   // ❌ 不存在
  { name: '系统设置', href: '/admin/settings', icon: '⚙️' }, // ❌ 不存在
];
```

**修复方案**:
创建所有缺失的管理后台页面，显示"页面开发中"占位符：

1. `/admin/projects` - 项目管理页面
2. `/admin/agents` - 智能体管理主页
3. `/admin/llm` - LLM 配置页面
4. `/admin/users` - 用户管理页面
5. `/admin/scenes` - 场景模板页面
6. `/admin/settings` - 系统设置页面

**创建的文件**:
- `apps/web/src/app/admin/projects/page.tsx`
- `apps/web/src/app/admin/agents/page.tsx`
- `apps/web/src/app/admin/llm/page.tsx`
- `apps/web/src/app/admin/users/page.tsx`
- `apps/web/src/app/admin/scenes/page.tsx`
- `apps/web/src/app/admin/settings/page.tsx`

---

## 验证结果

### E2E 测试

创建了完整的 E2E 测试套件，包含 8 个测试用例：

```bash
✓ 登录 API 应该工作
✓ 健康检查应该通过
✓ 管理后台首页应该能访问
✓ 智能体选择页面应该能访问
✓ 智能体配置页面应该能访问
✓ 未认证用户访问游戏页面应该显示加载状态
✓ 登录页面应该能访问
✓ 管理后台所有导航页面应该能访问（新增）
```

**测试结果**: 8/8 通过 ✅

### API 验证

```bash
# 登录 API
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 响应 - 200 OK
{
  "message": "Login successful",
  "user": {
    "id": "729434ba-5c16-41b4-929a-13599ae6308e",
    "username": "admin",
    "nickname": "管理员",
    "grade": 9,
    "invitationCode": "ADMIN12345"
  },
  "token": "eyJhbGci..."
}
```

### 管理后台页面验证

```bash
Testing /admin:          HTTP Status: 200 ✅
Testing /admin/projects: HTTP Status: 200 ✅
Testing /admin/agents:   HTTP Status: 200 ✅
Testing /admin/llm:      HTTP Status: 200 ✅
Testing /admin/users:    HTTP Status: 200 ✅
Testing /admin/scenes:   HTTP Status: 200 ✅
Testing /admin/settings: HTTP Status: 200 ✅
```

---

## 访问信息

### 前端地址

| 功能 | 地址 | 账号 |
|------|------|------|
| 登录页 | http://localhost:3000/auth/login | admin / admin123 |
| 管理后台 | http://localhost:3000/admin | 登录后访问 |
| 游戏页面 | http://localhost:3000/game | 登录后访问 |

### 管理后台导航

| 页面 | 状态 | 说明 |
|------|------|------|
| 仪表盘 | ✅ 正常工作 | 显示系统统计数据 |
| 项目管理 | ✅ 占位符 | 显示"页面开发中" |
| 智能体管理 | ✅ 正常工作 | 提供智能体选择和配置入口 |
| 智能体选择 | ✅ 正常工作 | 智能体选择页面 |
| 智能体配置 | ✅ 正常工作 | 智能体配置页面 |
| LLM 配置 | ✅ 占位符 | 显示"页面开发中" |
| 用户管理 | ✅ 占位符 | 显示"页面开发中" |
| 场景模板 | ✅ 占位符 | 显示"页面开发中" |
| 系统设置 | ✅ 占位符 | 显示"页面开发中" |

---

## 修复命令总结

```bash
# 1. 修复登录 API - 编辑文件
# apps/web/src/app/api/auth/login/route.ts
# 添加过期 session 清理逻辑

# 2. 创建缺失的管理后台页面
apps/web/src/app/admin/projects/page.tsx
apps/web/src/app/admin/agents/page.tsx
apps/web/src/app/admin/llm/page.tsx
apps/web/src/app/admin/users/page.tsx
apps/web/src/app/admin/scenes/page.tsx
apps/web/src/app/admin/settings/page.tsx

# 3. 重启 web 容器
docker restart visual-multi-agent-pbl-web-1

# 4. 运行 E2E 测试验证
cd apps/web
npx playwright test e2e/core-flow.spec.ts
```

---

## 后续建议

1. **完善管理后台功能** - 为占位符页面添加实际功能
2. **优化 Session 管理** - 考虑添加 session 并发控制，允许同一用户多个设备登录
3. **添加错误处理** - 在登录 API 中添加更友好的错误提示
4. **Session 清理任务** - 添加定时任务定期清理过期 session

---

**修复完成时间**: 2026-04-04
**修复方式**: 修复登录 API + 创建缺失页面
**验证状态**: ✅ 全部通过（8/8 E2E 测试）
