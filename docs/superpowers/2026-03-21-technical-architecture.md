# 技术架构详解

**文档版本**: 1.0
**创建日期**: 2026-03-21
**关联文档**: [系统设计文档](./2026-03-21-visual-pbl-platform-design.md)

---

## 一、架构演进路线

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        架构演进路线图                                    │
└─────────────────────────────────────────────────────────────────────────┘

阶段 1 (MVP)              阶段 2 (验证)              阶段 3 (增长)
本地 Docker          →    云服务器单体          →    托管 K8s
- Docker Compose          - 单机 Docker              - 阿里云 ACK
- 无证书/CDN              - Nginx + SSL              - 多副本 + HPA
- MinIO 本地存储          - 云数据库 RDS             - RDS 高可用
- 用户<1000               - 用户<10 万                - 用户>100 万

时间：1-3 个月             时间：3-6 个月              时间：6-12 个月
```

---

## 二、阶段一：本地开发架构（Docker Compose）

### 2.1 架构拓扑图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          本地开发环境                                    │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  docker-compose.dev.yml                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  nextjs-app:3000           (React + PixiJS + API Routes)        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │   │
│  │  │ PixiJS      │  │ API Routes  │  │ WebSocket   │             │   │
│  │  │ 渲染引擎    │  │ - 用户认证  │  │   Hub       │             │   │
│  │  │ 游戏场景    │  │ - 项目管理  │  │ Socket.IO   │             │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    ↕ HTTP/WebSocket                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  python-ai:8000            (FastAPI + AG2 + RAG)                │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │   │
│  │  │ AG2         │  │ RAG         │  │ LLM         │             │   │
│  │  │ Group Chat  │  │ 检索服务    │  │ Gateway     │             │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    ↕ SQL/pgvector                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  postgres:5432              (PostgreSQL 16 + pgvector)          │   │
│  │  - 用户数据表               - 向量索引表                         │   │
│  │  - 项目配置表               - 作品元数据表                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    ↕ Redis Protocol                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  redis:6379                 (Redis 7)                           │   │
│  │  - 会话缓存                 - WebSocket 状态                      │   │
│  │  - 排行榜                   - 限流计数器                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    ↕ S3 API                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  minio:9000                 (MinIO 对象存储)                     │   │
│  │  - 图片资源                 - 3D 模型                             │   │
│  │  - 文档文件                 - 静态资源                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Docker Compose 配置

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  nextjs-app:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/pbl_platform
      - REDIS_URL=redis://redis:6379
      - AI_SERVICE_URL=http://python-ai:8000
      - MINIO_ENDPOINT=minio:9000
      - MINIO_ACCESS_KEY=minioadmin
      - MINIO_SECRET_KEY=minioadmin123
    depends_on:
      - postgres
      - redis
      - python-ai

  python-ai:
    build:
      context: ./backend/ai-service
      dockerfile: Dockerfile.dev
    ports:
      - "8000:8000"
    volumes:
      - ./backend/ai-service:/app
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/pbl_platform
      - REDIS_URL=redis://redis:6379
      - LLM_PROVIDER=aliyun
      - EMBEDDING_MODEL=bge-m3
    depends_on:
      - postgres
      - redis

  postgres:
    image: pgvector/pgvector:pg16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: pbl_platform
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db:/docker-entrypoint-initdb.d

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"  # API
      - "9001:9001"  # Console
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

### 2.3 为什么不需要证书和 CDN（阶段一）

| 组件 | 生产环境作用 | 阶段一替代方案 |
|------|-------------|---------------|
| **SSL 证书** | HTTPS 加密传输 | 本地 HTTP 即可，无公网暴露 |
| **CDN** | 静态资源全球加速 | 本地访问无需加速，Nginx 静态文件服务足够 |
| **对象存储** | 海量文件存储 | MinIO 开源方案，S3 兼容 API |

---

## 三、阶段二：云服务器架构（单机 Docker）

### 3.1 架构拓扑图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          云服务器（阿里云/腾讯云）                        │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  公网 IP + 域名                                                          │
│         ↓                                                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Nginx (反向代理 + SSL 终止)                                       │   │
│  │  - HTTPS 证书（Let's Encrypt 免费）                               │   │
│  │  - 静态资源缓存                                                    │   │
│  │  - WebSocket 反向代理                                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│         ↓ ↘ ↘                                                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                    │
│  │ nextjs-app  │  │ python-ai   │  │  minio      │                    │
│  │  :3000      │  │  :8000      │  │  :9000      │                    │
│  └─────────────┘  └─────────────┘  └─────────────┘                    │
│         ↓              ↓               ↓                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  docker-compose.prod.yml (内部网络)                              │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │   │
│  │  │  postgres   │  │    redis    │  │   prometheus│             │   │
│  │  │  :5432      │  │    :6379    │  │    :9090    │             │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Nginx 配置示例

```nginx
# /etc/nginx/nginx.conf
http {
    upstream nextjs {
        server localhost:3000;
    }

    upstream python_ai {
        server localhost:8000;
    }

    # HTTPS 配置
    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

        # WebSocket 支持
        location /ws {
            proxy_pass http://nextjs;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }

        # AI 服务 API
        location /api/ai/ {
            proxy_pass http://python_ai/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # 前端静态资源
        location / {
            proxy_pass http://nextjs;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }

    # HTTP 重定向到 HTTPS
    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }
}
```

---

## 四、阶段三：托管 K8s 架构（阿里云 ACK）

### 4.1 架构拓扑图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          阿里云 ACK 集群                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  ALB (应用负载均衡) + WAF                                                │
│  - HTTPS 终止                                                            │
│  - DDoS 防护                                                             │
│  - 流量分发                                                               │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ↓                 ↓                 ↓
        ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
        │ Ingress       │  │ Ingress       │  │ Ingress       │
        │ nextjs-app    │  │ python-ai     │  │ websocket     │
        └───────────────┘  └───────────────┘  └───────────────┘
                │                  │                  │
                ↓                  ↓                  ↓
        ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
        │ Deployment    │  │ Deployment    │  │ Deployment    │
        │ nextjs-app    │  │ python-ai     │  │ ws-hub        │
        │ HPA: 1-10     │  │ HPA: 1-20     │  │ HPA: 1-5      │
        └───────────────┘  └───────────────┘  └───────────────┘
                │                  │                  │
                └──────────────────┼──────────────────┘
                                   ↓
        ┌─────────────────────────────────────────────────────────────────┐
        │  阿里云 RDS PostgreSQL (高可用版)                                 │
        │  - 主从复制                                                       │
        │  - 自动备份                                                       │
        │  - pgvector 插件                                                 │
        └─────────────────────────────────────────────────────────────────┘
        ┌─────────────────────────────────────────────────────────────────┐
        │  阿里云 Redis 集群版                                              │
        │  - 主从架构                                                       │
        │  - 自动故障转移                                                  │
        └─────────────────────────────────────────────────────────────────┘
        ┌─────────────────────────────────────────────────────────────────┐
        │  阿里云 OSS + CDN 全球加速                                        │
        │  - 图片/视频存储                                                  │
        │  - 静态资源加速                                                  │
        └─────────────────────────────────────────────────────────────────┘
```

### 4.2 Kubernetes 资源配置示例

```yaml
# nextjs-app-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nextjs-app
  namespace: pbl-platform
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nextjs-app
  template:
    metadata:
      labels:
        app: nextjs-app
    spec:
      containers:
      - name: nextjs-app
        image: registry.cn-hangzhou.aliyuncs.com/your-registry/nextjs-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: database-url
        - name: REDIS_URL
          value: "redis://redis-cluster:6379"
        - name: AI_SERVICE_URL
          value: "http://python-ai-service:8000"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: nextjs-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: nextjs-app
  minReplicas: 1
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## 五、数据流设计

### 5.1 用户登录流程

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        用户登录流程                                      │
└─────────────────────────────────────────────────────────────────────────┘

学生/家长                      Next.js API                 PostgreSQL
   │                              │                           │
   │  1. 输入用户名/密码           │                           │
   │────────────────────────────→│                           │
   │                              │  2. 验证凭证               │
   │                              │──────────────────────────→│
   │                              │  3. 返回用户信息           │
   │                              │←──────────────────────────│
   │                              │  4. 生成 Session           │
   │                              │  5. 写入 Redis             │
   │                              │──────────────────────────→│
   │  6. 返回登录成功 + Token      │                           │
   │←────────────────────────────│                           │
   │                              │                           │
   │  7. 后续请求携带 Token        │                           │
   │────────────────────────────→│                           │
   │                              │  8. 验证 Token (Redis)     │
   │                              │──────────────────────────→│
```

### 5.2 智能体协作流程

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      智能体协作流程                                      │
└─────────────────────────────────────────────────────────────────────────┘

学生 (CEO)         Next.js WebSocket      AG2 Group Chat      LLM API
   │                    │                      │                  │
   │ 1. 点击"开始任务"   │                      │                  │
   │───────────────────→│                      │                  │
   │                    │ 2. 创建 Group Chat    │                  │
   │                    │─────────────────────→│                  │
   │                    │                      │ 3. 分发任务       │
   │                    │                      │─────────────────→│
   │                    │                      │ 4. 流式返回       │
   │                    │                      │←─────────────────│
   │                    │ 5. WebSocket 推送     │                  │
   │                    │←─────────────────────│                  │
   │ 6. 实时显示对话气泡  │                      │                  │
   │←───────────────────│                      │                  │
   │                    │                      │                  │
   │ 7. @设计师智能体    │                      │                  │
   │───────────────────→│                      │                  │
   │                    │ 8. 添加到对话历史     │                  │
   │                    │─────────────────────→│                  │
   │                    │                      │ 9. 继续生成       │
```

### 5.3 RAG 检索流程

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        RAG 检索流程                                      │
└─────────────────────────────────────────────────────────────────────────┘

用户提问                     Python AI 服务               PostgreSQL
   │                              │                           │
   │  1. 发送问题                 │                           │
   │────────────────────────────→│                           │
   │                              │  2. Query 理解             │
   │                              │  (意图识别 + 关键词提取)   │
   │                              │                           │
   │                              │  3. 向量检索 (pgvector)   │
   │                              │──────────────────────────→│
   │                              │  4. 返回 Top 50 向量结果    │
   │                              │←──────────────────────────│
   │                              │                           │
   │                              │  5. BM25 关键词检索        │
   │                              │──────────────────────────→│
   │                              │  6. 返回 Top 50 关键词结果  │
   │                              │←──────────────────────────│
   │                              │                           │
   │                              │  7. 重排序 (BGE-Reranker) │
   │                              │  8. 取 Top 5               │
   │                              │                           │
   │                              │  9. 组装 Prompt + LLM      │
   │                              │──────────────────────────→│
   │  10. SSE 流式返回答案        │                           │
   │←────────────────────────────│                           │
```

---

## 六、技术选型对比总结

### 6.1 核心框架选型

| 决策点 | 选项 A | 选项 B | 最终选择 | 理由 |
|--------|--------|--------|----------|------|
| **前端框架** | Vue 3 + Nuxt | React + Next.js | Next.js | SSR 生态更成熟 |
| **2D 渲染** | Phaser 3 | PixiJS 8 | PixiJS | 更轻量，像素风友好 |
| **后端框架** | FastAPI 纯 Python | Next.js 全栈 | Next.js+Python | 兼顾前端体验和 AI 能力 |
| **Agent 框架** | AutoGen | AG2 (AgentScope) | AG2 | Group Chat 功能更强 |
| **向量检索** | Milvus | pgvector | pgvector | 早期架构简单 |
| **对象存储** | 云 OSS | MinIO | MinIO(本地)+ 云 OSS | 本地开发免费 |

### 6.2 为什么这样选择

**Next.js + Python 混合架构**：
- Next.js 负责用户体验（SSR、WebSocket、API 聚合）
- Python 负责 AI 能力（AG2、RAG、LLM）
- 职责清晰，可独立扩容

**pgvector 而非 Milvus**：
- 早期数据量<500 万，pgvector 性能足够
- 混合查询（SQL+ 向量）更方便
- 少一个组件，运维简单

**MinIO 本地 + 云 OSS 生产**：
- 本地开发零成本
- S3 兼容 API，代码无需修改
- 生产环境用云 OSS，更可靠

---

## 七、性能优化策略

### 7.1 前端性能优化

| 优化点 | 策略 | 目标 |
|--------|------|------|
| **首屏加载** | SSR + 代码分割 | <2 秒 |
| **PixiJS 渲染** | 精灵图合并 + 离屏缓存 | 60fps(PC)/24fps( 移动) |
| **WebSocket** | 消息压缩 + 增量同步 | 减少 50% 流量 |
| **图片加载** | WebP 格式 + 懒加载 | 减少 70% 体积 |

### 7.2 后端性能优化

| 优化点 | 策略 | 目标 |
|--------|------|------|
| **API 响应** | Redis 缓存热点数据 | P99<100ms |
| **LLM 调用** | 高频问题缓存 | 缓存命中率>60% |
| **向量检索** | HNSW 索引 + 元数据过滤 | P99<200ms |
| **数据库** | 连接池 + 读写分离 | QPS>1000 |

### 7.3 成本控制

| 成本项 | 阶段一 | 阶段二 | 阶段三 |
|--------|--------|--------|--------|
| **服务器** | 本地 (0 元) | 云服务器 (200 元/月) | ACK(2000 元/月+) |
| **数据库** | 本地 (0 元) | RDS(300 元/月) | RDS 高可用 (1000 元/月+) |
| **对象存储** | MinIO(0 元) | OSS(100 元/月) | OSS+CDN(500 元/月+) |
| **LLM API** | 开发额度 | 500 元/月 | 5000 元/月+ |
| **总计** | ~0 元 | ~1000 元/月 | ~10000 元/月+ |

---

**文档结束**
