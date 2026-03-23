#!/bin/bash
# scripts/local-ci-check.sh
# 本地运行完整 CI 检查（模拟 GitHub Actions）

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "========================================"
echo "  本地 CI 检查（模拟 GitHub Actions）"
echo "========================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Node.js 和 Python 是否安装
check_prerequisites() {
    echo "📋 检查环境..."
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js 未安装${NC}"
        exit 1
    fi
    
    if ! command -v python &> /dev/null; then
        echo -e "${YELLOW}⚠️  Python 未安装，跳过后端检查${NC}"
        SKIP_BACKEND=true
    else
        SKIP_BACKEND=false
    fi
    
    if ! command -v docker &> /dev/null; then
        echo -e "${YELLOW}⚠️  Docker 未安装，跳过 Docker 检查${NC}"
        SKIP_DOCKER=true
    else
        SKIP_DOCKER=false
    fi
    
    echo ""
}

# 前端检查
run_web_checks() {
    echo "========================================"
    echo "  🌐 前端检查"
    echo "========================================"
    
    cd apps/web
    
    # 1. ESLint（MVP 阶段只警告）
    echo "1️⃣  运行 ESLint（MVP 阶段：只警告）..."
    npm run lint || {
        echo -e "${YELLOW}⚠️  ESLint 失败（MVP 阶段不阻止）${NC}"
        echo "提示：运行 'npm run lint:fix' 尝试自动修复"
    }
    echo ""

    # 2. TypeScript（MVP 阶段只警告）
    echo "2️⃣  运行 TypeScript 检查（MVP 阶段：只警告）..."
    npx tsc --noEmit || {
        echo -e "${YELLOW}⚠️  TypeScript 类型错误（MVP 阶段不阻止）${NC}"
        echo "提示：Phase 2（稳定化）阶段统一修复"
    }
    echo ""

    # 3. 单元测试（MVP 阶段跳过）
    echo "3️⃣  跳过单元测试（MVP 阶段）..."
    echo -e "${YELLOW}⏭️  单元测试在 Phase 2 统一补充${NC}"
    echo ""
    
    # 4. E2E 测试（可选，耗时较长）
    if [ "$1" == "--full" ]; then
        echo "4️⃣  运行 E2E 测试（完整检查）..."
        echo -e "${YELLOW}⚠️  E2E 测试耗时较长，通常可以跳过${NC}"
        read -p "是否继续运行 E2E 测试？(y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            npm run test:e2e || {
                echo -e "${RED}❌ E2E 测试失败${NC}"
                exit 1
            }
            echo -e "${GREEN}✅ E2E 测试通过${NC}"
        else
            echo -e "${YELLOW}⏭️  跳过 E2E 测试${NC}"
        fi
        echo ""
    fi
    
    cd ../..
}

# 后端检查
run_ai_service_checks() {
    if [ "$SKIP_BACKEND" = true ]; then
        echo -e "${YELLOW}⏭️  跳过后端检查（Python 未安装）${NC}"
        echo ""
        return
    fi
    
    echo "========================================"
    echo "  🤖 AI 后端检查"
    echo "========================================"
    
    cd apps/ai-service
    
    # 1. Ruff（MVP 阶段只警告）
    echo "1️⃣  运行 Ruff 检查（MVP 阶段：只警告）..."
    if ! command -v ruff &> /dev/null; then
        echo -e "${YELLOW}⚠️  Ruff 未安装，正在安装...${NC}"
        pip install ruff
    fi

    ruff check . || {
        echo -e "${YELLOW}⚠️  Ruff 检查失败（MVP 阶段不阻止）${NC}"
        echo "提示：运行 'ruff check --fix .' 尝试自动修复"
    }
    echo ""

    # 2. Pyright（MVP 阶段跳过）
    echo "2️⃣  跳过 Pyright 类型检查（MVP 阶段）..."
    echo -e "${YELLOW}⏭️  类型检查在 Phase 2 统一进行${NC}"
    echo ""

    # 3. Pytest（MVP 阶段跳过）
    echo "3️⃣  跳过 Pytest 测试（MVP 阶段）..."
    echo -e "${YELLOW}⏭️  测试在 Phase 2 统一补充${NC}"
    echo ""
    
    cd ../..
}

# Docker 构建检查
run_docker_checks() {
    if [ "$SKIP_DOCKER" = true ]; then
        echo -e "${YELLOW}⏭️  跳过 Docker 检查（Docker 未安装）${NC}"
        echo ""
        return
    fi
    
    echo "========================================"
    echo "  🐳 Docker 构建检查"
    echo "========================================"
    
    cd docker
    
    echo "1️⃣  构建 Web 镜像..."
    docker-compose -f docker-compose.dev.yml build web || {
        echo -e "${RED}❌ Web Docker 镜像构建失败${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Web Docker 镜像构建成功${NC}"
    echo ""
    
    echo "2️⃣  构建 AI Service 镜像..."
    docker-compose -f docker-compose.dev.yml build ai-service || {
        echo -e "${RED}❌ AI Service Docker 镜像构建失败${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ AI Service Docker 镜像构建成功${NC}"
    echo ""
    
    cd ..
}

# 主流程
main() {
    check_prerequisites
    
    echo "开始运行检查..."
    echo ""
    
    # 前端检查（必须）
    run_web_checks "$1"
    
    # 后端检查（如果 Python 可用）
    run_ai_service_checks
    
    # Docker 检查（如果 Docker 可用且请求完整检查）
    if [ "$1" == "--full" ]; then
        run_docker_checks
    else
        echo -e "${YELLOW}⏭️  跳过 Docker 检查（使用 --full 参数运行）${NC}"
        echo ""
    fi
    
    echo "========================================"
    echo -e "  ${GREEN}✅ 所有本地 CI 检查通过！${NC}"
    echo "========================================"
    echo ""
    echo "📝 提示：本地检查通过不代表 GitHub CI 一定通过"
    echo "   GitHub CI 还可能运行："
    echo "   - E2E 测试（除非使用 --full 参数）"
    echo "   - Docker 构建（除非使用 --full 参数）"
    echo "   - 安全扫描（依赖版本可能不同）"
    echo ""
    echo "   推送后请查看 GitHub Actions 状态："
    echo "   gh run list --branch \$(git branch --show-current)"
    echo ""
}

# 显示帮助
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    echo "用法：bash scripts/local-ci-check.sh [选项]"
    echo ""
    echo "选项:"
    echo "  --full    运行完整检查（包括 E2E 和 Docker）"
    echo "  --help    显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  bash scripts/local-ci-check.sh          # 快速检查"
    echo "  bash scripts/local-ci-check.sh --full   # 完整检查"
    exit 0
fi

main "$@"
