# 前后端测试案例和测试脚本

**生成日期**: 2026-04-01
**适用范围**: Phase 1-13 所有功能模块

---

## 一、前端测试案例

### 1.1 用户认证测试

| 用例 ID | 测试名称 | 测试步骤 | 预期结果 |
|--------|---------|---------|---------|
| AUTH-001 | 用户注册成功 | 1. 访问注册页面<br>2. 输入有效用户名/邮箱/密码<br>3. 提交表单 | 注册成功，跳转到登录页 |
| AUTH-002 | 用户登录成功 | 1. 访问登录页面<br>2. 输入正确凭据<br>3. 提交 | 登录成功，跳转到首页 |
| AUTH-003 | 登录失败 - 错误密码 | 1. 输入正确用户名<br>2. 输入错误密码<br>3. 提交 | 显示"密码错误"提示 |
| AUTH-004 | 登出功能 | 1. 已登录状态<br>2. 点击登出按钮 | 成功登出，返回登录页 |
| AUTH-005 | 会话保持 | 1. 登录后刷新页面 | 保持登录状态 |

### 1.2 智能体系统测试

| 用例 ID | 测试名称 | 测试步骤 | 预期结果 |
|--------|---------|---------|---------|
| AGENT-001 | 智能体列表加载 | 1. 访问智能体选择页面<br>2. 等待数据加载 | 显示 5 种智能体类型 |
| AGENT-002 | 智能体选择 | 1. 点击智能体卡片<br>2. 确认选择状态 | 卡片高亮，状态更新 |
| AGENT-003 | 智能体状态切换 | 1. 切换智能体状态<br>2. 验证 UI 更新 | 状态指示器正确显示 |
| AGENT-004 | 对话气泡显示 | 1. 触发智能体对话<br>2. 验证气泡渲染 | 气泡正确显示和消失 |
| AGENT-005 | 智能体动画播放 | 1. 触发动画状态<br>2. 验证动画效果 | 动画流畅播放 |

### 1.3 项目管理测试

| 用例 ID | 测试名称 | 测试步骤 | 预期结果 |
|--------|---------|---------|---------|
| PROJ-001 | 创建项目 | 1. 点击创建项目<br>2. 填写项目信息<br>3. 提交 | 项目创建成功 |
| PROJ-002 | 项目列表 | 1. 访问项目列表页<br>2. 验证数据显示 | 正确显示所有项目 |
| PROJ-003 | 项目详情 | 1. 点击项目卡片<br>2. 验证详情展示 | 显示完整项目信息 |
| PROJ-004 | 项目编辑 | 1. 编辑项目信息<br>2. 保存更改 | 更新成功 |
| PROJ-005 | 项目删除 | 1. 删除项目<br>2. 确认删除 | 项目从列表移除 |

### 1.4 任务管理测试

| 用例 ID | 测试名称 | 测试步骤 | 预期结果 |
|--------|---------|---------|---------|
| TASK-001 | 任务看板加载 | 1. 访问任务看板<br>2. 验证列显示 | To Do/In Progress/Done 列正确显示 |
| TASK-002 | 创建任务 | 1. 点击添加任务<br>2. 填写任务信息<br>3. 提交 | 任务创建成功 |
| TASK-003 | 任务拖拽 | 1. 拖拽任务到不同列<br>2. 验证状态更新 | 任务状态正确更新 |
| TASK-004 | 任务分配 | 1. 分配任务给智能体<br>2. 验证分配结果 | 智能体正确显示在任务上 |
| TASK-005 | 任务进度更新 | 1. 更新任务进度<br>2. 验证进度条 | 进度条正确显示百分比 |

### 1.5 管理后台测试

| 用例 ID | 测试名称 | 测试步骤 | 预期结果 |
|--------|---------|---------|---------|
| ADMIN-001 | 用户列表加载 | 1. 访问用户管理页<br>2. 验证数据显示 | 正确显示所有用户 |
| ADMIN-002 | 用户角色修改 | 1. 修改用户角色<br>2. 保存更改 | 角色更新成功 |
| ADMIN-003 | 项目审核 | 1. 查看待审核项目<br>2. 通过/拒绝审核 | 审核状态正确更新 |
| ADMIN-004 | 数据统计 | 1. 访问数据看板<br>2. 验证统计图表 | 数据正确显示 |

---

## 二、后端 API 测试案例

### 2.1 认证 API

| 用例 ID | 端点 | 方法 | 请求体 | 预期响应 |
|--------|------|------|--------|---------|
| API-AUTH-001 | /api/auth/register | POST | {username, email, password} | 201 Created, {user, token} |
| API-AUTH-002 | /api/auth/login | POST | {email, password} | 200 OK, {user, token} |
| API-AUTH-003 | /api/auth/logout | POST | {} | 200 OK, {success: true} |
| API-AUTH-004 | /api/auth/me | GET | - | 200 OK, {user} |
| API-AUTH-005 | /api/auth/me | GET | (未授权) | 401 Unauthorized |

### 2.2 智能体 API

| 用例 ID | 端点 | 方法 | 请求体 | 预期响应 |
|--------|------|------|--------|---------|
| API-AGENT-001 | /api/admin/agents/list | GET | - | 200 OK, {agents: []} |
| API-AGENT-002 | /api/admin/agents/select | POST | {agentId} | 200 OK, {selected: true} |
| API-AGENT-003 | /api/admin/agents/select | GET | - | 200 OK, {selectedAgent} |
| API-AGENT-004 | /api/admin/agents/avatar | GET | - | 200 OK, {config} |
| API-AGENT-005 | /api/admin/agents/avatar | PUT | {config} | 200 OK, {updated: true} |

### 2.3 项目 API

| 用例 ID | 端点 | 方法 | 请求体 | 预期响应 |
|--------|------|------|--------|---------|
| API-PROJ-001 | /api/projects | GET | - | 200 OK, {projects: []} |
| API-PROJ-002 | /api/projects | POST | {title, description, ...} | 201 Created, {project} |
| API-PROJ-003 | /api/projects/:id | GET | - | 200 OK, {project} |
| API-PROJ-004 | /api/projects/:id | PUT | {title, ...} | 200 OK, {updated: true} |
| API-PROJ-005 | /api/projects/:id | DELETE | - | 200 OK, {deleted: true} |

### 2.4 任务 API

| 用例 ID | 端点 | 方法 | 请求体 | 预期响应 |
|--------|------|------|--------|---------|
| API-TASK-001 | /api/tasks | GET | - | 200 OK, {tasks: []} |
| API-TASK-002 | /api/tasks | POST | {title, projectId, ...} | 201 Created, {task} |
| API-TASK-003 | /api/tasks/:id | PUT | {status, ...} | 200 OK, {updated: true} |
| API-TASK-004 | /api/tasks/:id/assign | POST | {agentId} | 200 OK, {assigned: true} |
| API-TASK-005 | /api/tasks/:id | DELETE | - | 200 OK, {deleted: true} |

### 2.5 记忆系统 API

| 用例 ID | 端点 | 方法 | 请求体 | 预期响应 |
|--------|------|------|--------|---------|
| API-MEM-001 | /api/memories | POST | {agentId, type, content} | 201 Created, {memory} |
| API-MEM-002 | /api/memories/query | POST | {query, topK} | 200 OK, {memories: []} |
| API-MEM-003 | /api/memories/consolidate | POST | {agentId} | 200 OK, {consolidated: true} |
| API-MEM-004 | /api/memories/:id | DELETE | - | 200 OK, {deleted: true} |

---

## 三、自动化测试脚本

### 3.1 前端 E2E 测试脚本 (Playwright)

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should register a new user', async ({ page }) => {
    await page.goto('/auth/register');
    await page.fill('[data-testid="username"]', 'testuser');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="submit"]');
    await expect(page).toHaveURL('/auth/login');
  });

  test('should login successfully', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'wrongpassword');
    await page.click('[data-testid="submit"]');
    await expect(page.locator('[data-testid="error"]')).toBeVisible();
  });
});
```

```typescript
// tests/e2e/agents.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Agent System', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="submit"]');
  });

  test('should load agent selector', async ({ page }) => {
    await page.goto('/admin/agents/select');
    await expect(page.locator('[data-testid="agent-card"]')).toHaveCount(5);
  });

  test('should select an agent', async ({ page }) => {
    await page.goto('/admin/agents/select');
    await page.click('[data-testid="agent-card-mentor"]');
    await expect(page.locator('[data-testid="agent-card-mentor"]'))
      .toHaveClass(/selected/);
  });

  test('should display speech bubble', async ({ page }) => {
    await page.goto('/game');
    await page.click('[data-testid="agent-mentor"]');
    await expect(page.locator('[data-testid="speech-bubble"]')).toBeVisible();
  });
});
```

### 3.2 后端 API 测试脚本 (Jest + Supertest)

```typescript
// tests/api/auth.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('Auth API', () => {
  it('POST /api/auth/register - should create new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('user');
    expect(response.body.user.email).toBe('test@example.com');
  });

  it('POST /api/auth/login - should authenticate user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });

  it('GET /api/auth/me - should return current user', async () => {
    const token = await getAuthToken();
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('user');
  });
});
```

```typescript
// tests/api/agents.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('Agents API', () => {
  let authToken: string;

  beforeAll(async () => {
    authToken = await getAuthToken();
  });

  it('GET /api/admin/agents/list - should return agent list', async () => {
    const response = await request(app)
      .get('/api/admin/agents/list')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.agents).toHaveLength(5);
  });

  it('POST /api/admin/agents/select - should select agent', async () => {
    const response = await request(app)
      .post('/api/admin/agents/select')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ agentId: 'mentor' });

    expect(response.status).toBe(200);
    expect(response.body.selected).toBe(true);
  });

  it('GET /api/admin/agents/select - should return selected agent', async () => {
    const response = await request(app)
      .get('/api/admin/agents/select')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('selectedAgent');
  });
});
```

### 3.3 数据库测试脚本

```typescript
// tests/database/memories.test.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Agent Memories', () => {
  afterAll(async () => {
    await prisma.agentMemory.deleteMany();
    await prisma.$disconnect();
  });

  it('should create memory with embedding', async () => {
    const memory = await prisma.agentMemory.create({
      data: {
        agentId: 'test-agent',
        type: 'SHORT_TERM',
        content: 'Test memory content',
        importance: 5,
        tags: ['test', 'memory'],
      },
    });

    expect(memory.id).toBeDefined();
    expect(memory.content).toBe('Test memory content');
  });

  it('should query memories by agent', async () => {
    const memories = await prisma.agentMemory.findMany({
      where: { agentId: 'test-agent' },
    });

    expect(memories.length).toBeGreaterThan(0);
  });

  it('should delete memory', async () => {
    const memory = await prisma.agentMemory.create({
      data: {
        agentId: 'test-agent',
        type: 'SHORT_TERM',
        content: 'To be deleted',
        importance: 1,
      },
    });

    await prisma.agentMemory.delete({
      where: { id: memory.id },
    });

    const deleted = await prisma.agentMemory.findUnique({
      where: { id: memory.id },
    });

    expect(deleted).toBeNull();
  });
});
```

---

## 四、性能测试脚本

### 4.1 API 负载测试 (k6)

```javascript
// tests/performance/api-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const token = authenticate();

  // Test agent list endpoint
  const agents = http.get('http://localhost:3000/api/admin/agents/list', {
    headers: { Authorization: `Bearer ${token}` },
  });

  check(agents, {
    'agent list status is 200': (r) => r.status === 200,
    'agent list duration < 100ms': (r) => r.timings.duration < 100,
  });

  sleep(1);
}

function authenticate() {
  const res = http.post('http://localhost:3000/api/auth/login', {
    email: 'test@example.com',
    password: 'password123',
  });
  return JSON.parse(res.body).token;
}
```

---

## 五、运行测试命令

```bash
# 前端单元测试
npm run test

# 前端 E2E 测试
npm run test:e2e

# E2E 测试带 UI
npm run test:e2e:ui

# 后端 API 测试
cd apps/ai-service && pytest

# 数据库测试
npm run db:test

# 性能测试
k6 run tests/performance/api-load.js

# 全量测试
npm run test:all
```

---

## 六、测试覆盖率要求

| 模块 | 最低覆盖率 | 目标覆盖率 |
|------|-----------|-----------|
| 认证模块 | 90% | 95% |
| 智能体系统 | 85% | 90% |
| 项目管理 | 80% | 85% |
| 任务管理 | 80% | 85% |
| API 端点 | 90% | 95% |
| 数据库操作 | 85% | 90% |

---

**文档结束**
