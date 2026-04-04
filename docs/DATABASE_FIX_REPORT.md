# 数据库修复报告

**日期**: 2026-04-04
**状态**: ✅ 修复完成

---

## 问题根因

### 1. 登录报错 `users.role` 列不存在

**错误日志**:
```
The column `users.role` does not exist in the current database.
POST /api/auth/login 500 in 510ms
```

**原因**: Prisma schema 中有 `role` 字段，但数据库表缺少该列。

### 2. 管理后台 404 - `llm_configs` 表不存在

**错误日志**:
```
The table `public.llm_configs` does not exist in the current database.
GET /api/admin/dashboard 200 (but returning 0 for all counts)
```

**原因**: 数据库缺少 LLM 配置表。

### 3. Docker 初始化脚本不执行

**关键发现**: `docker compose up --build` **不会** 自动执行迁移脚本！

- PostgreSQL 的 `/docker-entrypoint-initdb.d/*.sql` 只在**首次创建数据卷**时执行
- 已有数据卷时，初始化脚本被跳过
- 这就是为什么之前创建的 `006-add-missing-tables.sql` 没有生效

---

## 修复步骤

### 步骤 1: 添加 `users.role` 列

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'USER';
```

### 步骤 2: 创建 `llm_configs` 表

```sql
CREATE TABLE IF NOT EXISTS llm_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) UNIQUE NOT NULL,
    api_key VARCHAR(255) NOT NULL,
    base_url TEXT,
    models JSONB,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 步骤 3: 创建测试用户

```bash
# 生成 bcrypt 哈希
docker exec web-node -e "bcrypt.hashSync('admin123', 10)"

# 插入用户
INSERT INTO users (username, password_hash, nickname, grade, invitation_code, role)
VALUES ('admin', '$2a$10$yrn/Mhi0yp7gTDX3P/5FjezD7.kXPVOMvw1Ao.z0XFBuzr31dMYyK', '管理员', 9, 'ADMIN12345', 'ADMIN');
```

---

## 验证结果

### 登录 API ✅

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 响应
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

### 管理后台 Dashboard API ✅

```bash
curl http://localhost:3000/api/admin/dashboard

# 响应
{
  "totalProjects": 0,
  "totalUsers": 1,
  "totalAgents": 5,
  "activeLlmConfigs": 0
}
```

### 健康检查 ✅

```bash
curl http://localhost:3000/api/health

# 响应
{"status":"ok","timestamp":"2026-04-04T05:52:39.687Z","service":"visual-pbl-web"}
```

---

## 访问信息

### 前端地址

| 功能 | 地址 | 账号 |
|------|------|------|
| 登录页 | http://localhost:3000/auth/login | admin / admin123 |
| 管理后台 | http://localhost:3000/admin | 登录后访问 |
| 游戏页面 | http://localhost:3000/game | 登录后访问 |

### 后端服务

| 服务 | 地址 |
|------|------|
| Web API | http://localhost:3000 |
| AI Service | http://localhost:8000 |
| MinIO Console | http://localhost:9001 |
| PostgreSQL | localhost:5432 |

---

## 长期解决方案

### 问题

手动执行 SQL 修复不是长久之计，应该使用 Prisma Migrations：

```bash
# 开发环境
npx prisma migrate dev --name add_role_and_llm_configs

# 生产环境
npx prisma migrate deploy
```

### 建议

1. **使用 Prisma Migrate** 管理数据库 schema 变更
2. **CI/CD 集成** 在部署时自动执行 `prisma migrate deploy`
3. **数据库备份** 在执行迁移前备份数据
4. ** schema 审查** 定期对比 Prisma schema 和实际数据库结构

---

## 修复命令总结

```bash
# 1. 添加 role 列
docker exec visual-multi-agent-pbl-postgres-1 psql -U postgres -d pbl_platform \
  -c "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'USER';"

# 2. 创建 llm_configs 表
docker exec visual-multi-agent-pbl-postgres-1 psql -U postgres -d pbl_platform \
  -c "CREATE TABLE IF NOT EXISTS llm_configs (...);"

# 3. 重新生成 Prisma 客户端
docker exec visual-multi-agent-pbl-web-1 npx prisma generate

# 4. 创建测试用户
docker exec visual-multi-agent-pbl-postgres-1 psql -U postgres -d pbl_platform \
  -c "INSERT INTO users (username, password_hash, nickname, grade, invitation_code, role) VALUES ('admin', '\$2a\$10\$yrn/Mhi0yp7gTDX3P/5FjezD7.kXPVOMvw1Ao.z0XFBuzr31dMYyK', '管理员', 9, 'ADMIN12345', 'ADMIN');"
```

---

**修复完成时间**: 2026-04-04
**修复方式**: 直接 SQL 执行 + Prisma 重新生成
**验证状态**: ✅ 全部通过
