# Production 部署指南

**版本**: 1.0
**更新日期**: 2026-04-01
**状态**: 就绪

---

## 前置条件

### 系统要求
- Docker 20.10+
- Docker Compose 2.0+
- 至少 4GB RAM
- 至少 20GB 存储空间

### 环境变量配置

1. 复制环境变量文件：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，配置生产环境变量：

```bash
# ===== 数据库 =====
DATABASE_URL=postgresql://pbl_user:YOUR_SECURE_PASSWORD@postgres:5432/pbl_platform

# ===== Redis =====
REDIS_URL=redis://redis:6379

# ===== MinIO =====
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=YOUR_MINIO_ACCESS_KEY
MINIO_SECRET_KEY=YOUR_MINIO_SECRET_KEY
MINIO_SECURE=false

# ===== Next.js =====
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=GENERATE_32_CHAR_SECRET

# ===== JWT =====
JWT_SECRET=GENERATE_64_CHAR_SECRET

# ===== AI 服务 =====
AI_SERVICE_URL=http://ai-service:8000

# ===== LLM 配置 =====
LLM_PROVIDER=aliyun
LLM_API_KEY=YOUR_LLM_API_KEY
LLM_MODEL=qwen-max
```

### 生成安全密钥

```bash
# 生成 NEXTAUTH_SECRET (32 字符)
openssl rand -base64 24

# 生成 JWT_SECRET (64 字符)
openssl rand -base64 48

# 生成 MinIO 密钥
openssl rand -base64 16  # Access Key
openssl rand -base64 32  # Secret Key
```

---

## 部署步骤

### 1. 启动生产环境

```bash
cd docker
docker-compose -f docker-compose.prod.yml up -d
```

### 2. 验证服务健康状态

```bash
# 查看所有服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 等待所有服务健康
docker-compose -f docker-compose.prod.yml ps --format "table {{.Name}}\t{{.Status}}"
```

### 3. 运行数据库迁移

```bash
# 进入 web 容器
docker-compose -f docker-compose.prod.yml exec web npx prisma migrate deploy

# 初始化数据库
docker-compose -f docker-compose.prod.yml exec web npx prisma db seed
```

### 4. 验证部署

```bash
# 检查 Web 服务
curl http://localhost:3000/api/health

# 检查 AI 服务
curl http://localhost:8000/api/v1/health

# 预期响应：
# {"status":"ok","timestamp":"2026-04-01T..."}
```

---

## 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| Web (Next.js) | 3000 | 主应用 |
| AI Service | 8000 | AI 智能体服务 |
| PostgreSQL | 5432 | 数据库 |
| Redis | 6379 | 缓存 |
| MinIO | 9000 | 对象存储 |
| MinIO Console | 9001 | MinIO 管理界面 |

---

## 监控和维护

### 查看日志

```bash
# 所有服务日志
docker-compose -f docker-compose.prod.yml logs -f

# 单个服务日志
docker-compose -f docker-compose.prod.yml logs -f web
docker-compose -f docker-compose.prod.yml logs -f ai-service
```

### 重启服务

```bash
# 重启所有服务
docker-compose -f docker-compose.prod.yml restart

# 重启单个服务
docker-compose -f docker-compose.prod.yml restart web
docker-compose -f docker-compose.prod.yml restart ai-service
```

### 更新部署

```bash
# 拉取最新代码
git pull origin main

# 重新构建并重启
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 备份策略

### 数据库备份

```bash
# 备份数据库
docker-compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U pbl_user pbl_platform > backup_$(date +%Y%m%d).sql

# 恢复数据库
docker-compose -f docker-compose.prod.yml exec -T postgres \
  psql -U pbl_user pbl_platform < backup_20260401.sql
```

### MinIO 数据备份

```bash
# 使用 mc 工具备份
docker run --rm \
  -v minio_data:/data \
  -v $(pwd)/backup:/backup \
  minio/mc mirror /data /backup
```

---

## 故障排查

### 常见问题

**1. 容器无法启动**
```bash
# 检查日志
docker-compose -f docker-compose.prod.yml logs web

# 检查环境变量
docker-compose -f docker-compose.prod.yml config
```

**2. 数据库连接失败**
```bash
# 检查 PostgreSQL 是否运行
docker-compose -f docker-compose.prod.yml ps postgres

# 测试连接
docker-compose -f docker-compose.prod.yml exec postgres \
  pg_isready -U pbl_user
```

**3. 内存不足**
```bash
# 查看资源使用
docker stats

# 清理未使用的容器
docker system prune -a
```

---

## 安全建议

1. **密钥管理**
   - 使用强随机密钥
   - 定期轮换密钥
   - 不要将 `.env` 文件提交到 Git

2. **网络安全**
   - 使用防火墙限制访问
   - 仅暴露必要端口
   - 考虑使用反向代理（Nginx/Traefik）

3. **数据备份**
   - 每天自动备份数据库
   - 定期测试恢复流程
   - 异地备份存储

---

## 性能优化

### 调整容器资源限制

编辑 `docker-compose.prod.yml`:

```yaml
services:
  web:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G

  ai-service:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

### 数据库优化

```sql
-- 添加 pgvector 索引
CREATE INDEX CONCURRENTLY ON agent_memories
USING hnsw (embedding vector_cosine_ops);

-- 添加常用查询索引
CREATE INDEX CONCURRENTLY idx_agent_memories_agent_id
ON agent_memories (agent_id);

CREATE INDEX CONCURRENTLY idx_agent_memories_created_at
ON agent_memories (created_at DESC);
```

---

## 检查清单

部署完成后，请验证以下项目：

- [ ] 所有容器健康状态为 healthy
- [ ] Web 服务响应 `/api/health`
- [ ] AI 服务响应 `/api/v1/health`
- [ ] 数据库迁移成功
- [ ] 可以访问主应用（端口 3000）
- [ ] MinIO 控制台可访问（端口 9001）
- [ ] 数据库备份策略已配置
- [ ] 监控日志正常
- [ ] `.env` 文件未提交到 Git

---

**文档结束**
