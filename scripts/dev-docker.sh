#!/bin/bash
# scripts/dev-docker.sh
# 启动 Docker 开发环境（统一本地与服务端环境）

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

DOCKER_DIR="$SCRIPT_DIR/docker"

echo "========================================"
echo "  🐳 启动 Docker 开发环境"
echo "========================================"
echo ""

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装"
    echo ""
    echo "请安装 Docker Desktop: https://www.docker.com/products/docker-desktop"
    echo ""
    echo "或者使用本地开发模式（不推荐，可能与环境不一致）:"
    echo "  cd apps/web && npm run dev"
    exit 1
fi

# 检查 docker-compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ docker-compose 未安装"
    echo ""
    echo "请安装 docker-compose: https://docs.docker.com/compose/install/"
    exit 1
fi

# 确定 docker-compose 命令
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

# 检查.env 文件
if [ ! -f "$DOCKER_DIR/.env" ]; then
    echo "⚠️  docker/.env 文件不存在，正在创建..."
    cp "$DOCKER_DIR/.env.example" "$DOCKER_DIR/.env" 2>/dev/null || {
        echo "创建默认环境变量..."
        cat > "$DOCKER_DIR/.env" <<EOF
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/pbl_platform

# Redis
REDIS_URL=redis://redis:6379

# MinIO
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123

# Auth
NEXTAUTH_SECRET=dev-secret-change-in-prod
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=dev-jwt-secret

# LLM
LLM_PROVIDER=mock
EOF
    }
    echo "✅ docker/.env 已创建"
    echo ""
fi

# 启动服务
echo "启动服务..."
echo ""

$COMPOSE_CMD -f "$DOCKER_DIR/docker-compose.dev.yml" up -d

echo ""
echo "等待服务启动..."
sleep 5

# 显示状态
echo ""
echo "========================================"
echo "  服务状态"
echo "========================================"
echo ""

$COMPOSE_CMD -f "$DOCKER_DIR/docker-compose.dev.yml" ps

echo ""
echo "========================================"
echo "  访问地址"
echo "========================================"
echo ""
echo "  🌐 Web 前端：  http://localhost:3000"
echo "  🤖 AI 服务：   http://localhost:8000"
echo "  📊 MinIO 控制台：http://localhost:9001"
echo "  🗄️  数据库：   postgresql://localhost:5432"
echo "  💾 Redis:      redis://localhost:6379"
echo ""
echo "========================================"
echo "  常用命令"
echo "========================================"
echo ""
echo "  查看日志：     $COMPOSE_CMD -f docker-compose.dev.yml logs -f"
echo "  停止服务：     $COMPOSE_CMD -f docker-compose.dev.yml down"
echo "  重启服务：     $COMPOSE_CMD -f docker-compose.dev.yml restart"
echo "  清理数据：     $COMPOSE_CMD -f docker-compose.dev.yml down -v (危险！)"
echo ""
echo "========================================"
echo ""
echo "提示：Docker 环境与 GitHub CI 使用相同配置"
echo "     可避免本地/服务端环境差异问题"
echo ""

# 检查 Web 服务是否健康
echo "检查 Web 服务健康状态..."
for i in {1..12}; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✅ Web 服务已启动"
        break
    fi
    if [ $i -eq 12 ]; then
        echo "⚠️  Web 服务启动超时，请检查日志"
        echo "运行：$COMPOSE_CMD -f docker-compose.dev.yml logs web"
    fi
    sleep 5
done

# 检查 AI 服务是否健康
echo "检查 AI 服务健康状态..."
for i in {1..6}; do
    if curl -s http://localhost:8000/api/v1/health > /dev/null 2>&1; then
        echo "✅ AI 服务已启动"
        break
    fi
    if [ $i -eq 6 ]; then
        echo "⚠️  AI 服务启动超时，请检查日志"
        echo "运行：$COMPOSE_CMD -f docker-compose.dev.yml logs ai-service"
    fi
    sleep 5
done

echo ""
echo "✅ 开发环境启动完成！"
echo ""
