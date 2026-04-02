# Visual PBL 平台 - Docker 部署操作指南

**日期**: 2026-04-03
**版本**: 1.0
**部署方式**: Docker Compose

---

## 📋 目录

1. [服务地址和端口](#1-服务地址和端口)
2. [默认账号和密码](#2-默认账号和密码)
3. [快速启动](#3-快速启动)
4. [服务配置详解](#4-服务配置详解)
5. [常见问题](#5-常见问题)

---

## 1. 服务地址和端口

### Docker Compose 部署后，以下服务将可用：

| 服务 | 地址 | 端口 | 说明 |
|------|------|------|------|
| **前端应用** | http://localhost:3333 | 3333 | Next.js 前端（映射到容器 3000） |
| **管理后台** | http://localhost:3333/admin | 3333 | 管理后台界面 |
| **AI 后端 API** | http://localhost:8000 | 8000 | FastAPI 后端服务 |
| **MinIO 控制台** | http://localhost:9001 | 9001 | 对象存储管理界面 |
| **PostgreSQL** | localhost | 5432 | 数据库（外部连接） |
| **Redis** | localhost | 6379 | 缓存服务（外部连接） |

### 访问流程

```
用户浏览器
    ↓
http://localhost:3333 (前端)
    ↓
http://localhost:8000 (后端 API)
    ↓
PostgreSQL + Redis + MinIO
```

---

## 2. 默认账号和密码

### 2.1 首次启动 - 需要注册

系统启动后，**没有预设用户账号**，需要通过注册页面创建第一个账号：

1. **访问前端**: http://localhost:3333
2. **点击注册**: 点击右上角"注册"链接
3. **填写信息**:
   - 用户名：`testuser`（必填，3-50 字符）
   - 密码：`password123`（必填，至少 6 位）
   - 昵称：可选
   - 年级：可选（1-12）
   - 邀请码：可选（首次注册可不填）

4. **提交注册** → 自动跳转到登录页
5. **使用注册的账号登录**

### 2.2 测试账号（需先注册）

| 字段 | 值 | 说明 |
|------|-----|------|
| 用户名 | `testuser` | 示例用户名 |
| 密码 | `password123` | 示例密码 |
| 邮箱 | `test@example.com` | 示例邮箱 |

**注意**: 这些是示例值，实际使用时需要自行注册。

### 2.3 MinIO 默认账号

| 服务 | 用户名 | 密码 |
|------|--------|------|
| MinIO 控制台 | `minioadmin` | `minioadmin123` |

访问：http://localhost:9001

### 2.4 PostgreSQL 默认账号

| 字段 | 值 |
|------|-----|
| 主机 | localhost |
| 端口 | 5432 |
| 数据库 | pbl_platform |
| 用户名 | `postgres` |
| 密码 | `postgres` |

---

## 3. 快速启动

### 3.1 前置条件

确保已安装：
- [x] Docker Desktop（Windows/Mac）或 Docker + Docker Compose（Linux）
- [x] 至少 4GB 可用内存
- [x] 至少 10GB 可用磁盘空间

### 3.2 启动步骤

```bash
# 1. 进入项目目录
cd E:\my-project\visual-multi-agent-pbl

# 2. 启动 Docker Compose 开发环境
docker-compose -f docker/docker-compose.dev.yml up -d

# 3. 查看服务状态
docker-compose -f docker/docker-compose.dev.yml ps

# 4. 查看日志
docker-compose -f docker/docker-compose.dev.yml logs -f

# 5. 停止服务
docker-compose -f docker/docker-compose.dev.yml down

# 6. 重启服务
docker-compose -f docker/docker-compose.dev.yml restart
```

### 3.3 验证服务

```bash
# 检查前端健康状态
curl http://localhost:3333/api/health

# 检查后端 API 健康状态
curl http://localhost:8000/api/v1/health

# 预期输出：
# {"status":"ok","timestamp":"...","service":"visual-pbl-web"}
```

### 3.4 访问应用

1. **打开浏览器** 访问：http://localhost:3333
2. **注册账号** 点击"注册"创建新用户
3. **登录系统** 使用注册的账号登录
4. **访问管理后台** http://localhost:3333/admin

---

## 4. 服务配置详解

### 4.1 环境变量配置

项目使用 Docker Compose 内置环境变量，默认配置如下：

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `DATABASE_URL` | `postgresql://postgres:postgres@postgres:5432/pbl_platform` | 数据库连接 |
| `REDIS_URL` | `redis://redis:6379` | Redis 连接 |
| `NEXTAUTH_SECRET` | `dev-secret-change-in-prod` | NextAuth 密钥 |
| `JWT_SECRET` | `dev-jwt-secret` | JWT 密钥 |
| `MINIO_ENDPOINT` | `minio:9000` | MinIO 端点 |
| `MINIO_ACCESS_KEY` | `minioadmin` | MinIO 访问密钥 |
| `MINIO_SECRET_KEY` | `minioadmin123` | MinIO 密钥 |
| `LLM_PROVIDER` | `mock` | LLM 提供商（mock/aliyun） |

### 4.2 自定义配置（可选）

如需自定义配置，创建 `.env` 文件：

```bash
# 复制示例文件
cp docker/.env.prod.example .env

# 编辑 .env 文件
# vi .env 或使用文本编辑器
```

**关键配置项**：

```env
# 数据库
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password-here

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=your-minio-password-here

# NextAuth
NEXTAUTH_SECRET=your-secret-key-here

# LLM 配置（如使用真实 LLM）
LLM_PROVIDER=aliyun
LLM_API_KEY=your-api-key-here
LLM_MODEL=qwen-max
```

### 4.3 管理后台功能

访问：http://localhost:3333/admin

| 菜单 | 路径 | 功能 |
|------|------|------|
| 仪表盘 | `/admin` | 系统概览 |
| 项目管理 | `/admin/projects` | 项目 CRUD |
| 智能体管理 | `/admin/agents` | 智能体配置 |
| LLM 配置 | `/admin/llm` | LLM 参数设置 |
| 用户管理 | `/admin/users` | 用户管理 |
| 场景模板 | `/admin/scenes` | 场景管理 |
| 系统设置 | `/admin/settings` | 系统配置 |

### 4.4 智能体系统

系统预设 5 种智能体（启动时自动初始化）：

| 智能体 | 类型 | 功能 |
|--------|------|------|
| 智慧导师 | mentor | 学习指导、概念解释 |
| 创意设计师 | designer | 视觉设计、创意辅助 |
| 数据分析师 | analyst | 数据分析、图表生成 |
| 运营推广师 | marketer | 内容写作、展示推广 |
| CEO 助手 | assistant | 任务协调、进度跟踪 |

---

## 5. 常见问题

### 5.1 无法访问前端（http://localhost:3333）

**问题**: 浏览器显示"无法连接"或"连接超时"

**解决方案**:
```bash
# 1. 检查 Docker 容器状态
docker-compose -f docker/docker-compose.dev.yml ps

# 2. 查看前端日志
docker-compose -f docker/docker-compose.dev.yml logs web

# 3. 重启前端服务
docker-compose -f docker/docker-compose.dev.yml restart web

# 4. 确认端口映射
docker port docker-web-1
```

### 5.2 注册/登录失败

**问题**: 注册或登录时显示错误

**解决方案**:
```bash
# 1. 检查后端 API 状态
curl http://localhost:8000/api/v1/health

# 2. 查看后端日志
docker-compose -f docker/docker-compose.dev.yml logs ai-service

# 3. 检查数据库连接
docker-compose -f docker/docker-compose.dev.yml logs postgres
```

### 5.3 数据库初始化失败

**问题**: 首次启动时数据库表未创建

**解决方案**:
```bash
# 1. 停止所有服务
docker-compose -f docker/docker-compose.dev.yml down -v

# 2. 删除数据库数据卷（注意：会删除所有数据）
docker volume rm visual-multi-agent-pbl_postgres_data

# 3. 重新启动
docker-compose -f docker/docker-compose.dev.yml up -d

# 4. 等待 30 秒让初始化脚本运行
sleep 30

# 5. 验证表已创建
docker exec -it docker-postgres-1 psql -U postgres -d pbl_platform -c "\dt"
```

### 5.4 MinIO 无法访问

**问题**: http://localhost:9001 无法访问

**解决方案**:
```bash
# 1. 检查 MinIO 容器状态
docker ps | grep minio

# 2. 查看 MinIO 日志
docker logs docker-minio-1

# 3. 重启 MinIO
docker-compose -f docker/docker-compose.dev.yml restart minio
```

**默认账号**:
- 用户名：`minioadmin`
- 密码：`minioadmin123`

### 5.5 端口冲突

**问题**: 端口已被占用

**解决方案**: 修改 `docker/docker-compose.dev.yml` 中的端口映射

```yaml
# 原配置
ports:
  - "3333:3000"
  - "8000:8000"
  - "9001:9001"

# 修改为其他端口
ports:
  - "8080:3000"    # 前端改为 8080
  - "8001:8000"    # 后端改为 8001
  - "9002:9001"    # MinIO 改为 9002
```

### 5.6 Docker Desktop 资源不足

**问题**: 容器频繁重启或无法启动

**解决方案**:

1. **增加 Docker 资源配额**（Docker Desktop 设置）:
   - CPU: 至少 4 核
   - 内存：至少 4GB
   - 磁盘：至少 20GB

2. **关闭不必要的容器**:
```bash
# 停止所有服务
docker-compose -f docker/docker-compose.dev.yml down
```

---

## 6. 开发和调试

### 6.1 查看实时日志

```bash
# 查看所有服务日志
docker-compose -f docker/docker-compose.dev.yml logs -f

# 查看特定服务日志
docker-compose -f docker/docker-compose.dev.yml logs -f web
docker-compose -f docker/docker-compose.dev.yml logs -f ai-service
docker-compose -f docker/docker-compose.dev.yml logs -f postgres
```

### 6.2 进入容器调试

```bash
# 进入前端容器
docker exec -it docker-web-1 /bin/sh

# 进入后端容器
docker exec -it docker-ai-service-1 /bin/sh

# 进入数据库容器
docker exec -it docker-postgres-1 psql -U postgres -d pbl_platform
```

### 6.3 数据库操作

```bash
# 连接到 PostgreSQL
docker exec -it docker-postgres-1 psql -U postgres -d pbl_platform

# 常用 SQL 命令
\dt                 # 列出所有表
\d users            # 查看 users 表结构
SELECT * FROM users; # 查询用户
\q                  # 退出
```

### 6.4 清理和重置

```bash
# 清理所有 Docker 资源（谨慎使用）
docker-compose -f docker/docker-compose.dev.yml down -v

# 重新构建所有镜像
docker-compose -f docker/docker-compose.dev.yml build --no-cache

# 重启并重新构建
docker-compose -f docker/docker-compose.dev.yml up -d --build
```

---

## 7. 部署检查清单

部署前请确认：

- [ ] Docker Desktop 已启动并运行
- [ ] 端口 3333、8000、9001 未被占用
- [ ] 至少 4GB 可用内存
- [ ] 已执行 `docker-compose up -d`
- [ ] 所有容器状态为 "Up" 和 "healthy"
- [ ] 可以访问 http://localhost:3333
- [ ] 已完成用户注册
- [ ] 可以正常登录

---

## 8. 参考文档

- [项目完成报告](./COMPLETION_REPORT.md)
- [构建验证报告](./BUILD_VERIFICATION_REPORT.md)
- [测试验证报告](./TEST_VALIDATION_REPORT.md)
- [最终状态报告](./FINAL_STATUS_REPORT.md)

---

**文档版本**: 1.0
**最后更新**: 2026-04-03
**维护者**: Visual PBL Team
