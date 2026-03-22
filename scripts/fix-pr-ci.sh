#!/bin/bash
# scripts/fix-pr-ci.sh
# 用法：bash scripts/fix-pr-ci.sh <branch-name>
# 自动修复 CI 错误并推送

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

BRANCH=$1

if [ -z "$BRANCH" ]; then
    echo -e "${RED}用法：bash scripts/fix-pr-ci.sh <branch-name>${NC}"
    echo ""
    echo "可用的分支："
    git branch -r --no-merged origin/main | grep feature | sed 's/origin\///'
    exit 1
fi

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}修复 PR CI 错误${NC}"
echo -e "${GREEN}分支：$BRANCH${NC}"
echo -e "${GREEN}=========================================${NC}"

# 检查分支是否存在
if ! git rev-parse --verify "$BRANCH" &>/dev/null; then
    echo -e "${RED}分支 $BRANCH 不存在${NC}"
    exit 1
fi

# 切换到分支
echo -e "${YELLOW}切换到分支 $BRANCH${NC}"
git checkout "$BRANCH"

# 拉取最新代码
echo -e "${YELLOW}拉取最新代码...${NC}"
git pull origin "$BRANCH" 2>/dev/null || true

FIXED=0

# ========== 前端修复 ==========
echo -e "${YELLOW}=== 前端修复 ===${NC}"

if [ -f "apps/web/package.json" ]; then
    cd apps/web

    # 安装依赖（如果需要）
    if [ ! -d "node_modules" ]; then
        echo "安装依赖..."
        npm install
    fi

    # ESLint 自动修复
    echo "运行 ESLint 自动修复..."
    if npm run lint:fix 2>/dev/null; then
        echo -e "${GREEN}✓ ESLint 修复完成${NC}"
        FIXED=1
    else
        echo -e "${YELLOW}⚠ ESLint 修复完成但仍有无法自动修复的问题${NC}"
        FIXED=1
    fi

    # TypeScript 检查（不修复，只报告）
    echo "运行 TypeScript 检查..."
    if npm run type-check 2>/dev/null; then
        echo -e "${GREEN}✓ TypeScript 检查通过${NC}"
    else
        echo -e "${RED}❌ TypeScript 错误需要手动修复${NC}"
        echo "查看错误详情并手动编辑文件"
    fi

    # 运行测试
    echo "运行测试..."
    if npm test 2>/dev/null; then
        echo -e "${GREEN}✓ 测试通过${NC}"
    else
        echo -e "${RED}❌ 测试失败需要手动修复${NC}"
    fi

    cd "$REPO_ROOT"
fi

# ========== 后端修复 ==========
echo -e "${YELLOW}=== 后端修复 ===${NC}"

if [ -f "apps/ai-service/requirements.txt" ]; then
    cd apps/ai-service

    # 检查 Python 环境
    if command -v python3 &>/dev/null; then
        PYTHON=python3
    elif command -v python &>/dev/null; then
        PYTHON=python
    else
        echo -e "${RED}未找到 Python${NC}"
        cd "$REPO_ROOT"
        exit 1
    fi

    # 安装依赖
    echo "检查依赖..."
    $PYTHON -m pip install -q ruff mypy 2>/dev/null || true

    # Ruff 自动修复
    echo "运行 Ruff 自动修复..."
    if ruff check --fix . 2>/dev/null; then
        echo -e "${GREEN}✓ Ruff 修复完成${NC}"
        FIXED=1
    else
        echo -e "${YELLOW}⚠ Ruff 修复完成但仍有问题${NC}"
        FIXED=1
    fi

    # Ruff 格式化
    echo "运行 Ruff 格式化..."
    if ruff format . 2>/dev/null; then
        echo -e "${GREEN}✓ Ruff 格式化完成${NC}"
        FIXED=1
    else
        echo -e "${YELLOW}⚠ Ruff 格式化完成${NC}"
        FIXED=1
    fi

    # Mypy 类型检查
    echo "运行 Mypy 类型检查..."
    if mypy . --ignore-missing-imports 2>/dev/null; then
        echo -e "${GREEN}✓ Mypy 检查通过${NC}"
    else
        echo -e "${RED}❌ 类型错误需要手动修复${NC}"
    fi

    cd "$REPO_ROOT"
fi

# ========== 提交修复 ==========
echo ""
echo -e "${YELLOW}=== 检查更改 ===${NC}"

if ! git diff --quiet; then
    echo -e "${YELLOW}发现更改，准备提交...${NC}"
    git add -A

    COMMIT_MSG="fix: auto-fix CI errors in $BRANCH"
    git commit -m "$COMMIT_MSG"

    echo -e "${YELLOW}推送到远程...${NC}"
    git push origin "$BRANCH"

    echo ""
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}✅ 修复完成！${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo ""
    echo "CI 将自动重新运行："
    echo "https://github.com/eyangisgod-cell/visual-multi-agent-pbl/actions"
    echo ""
    if [ $FIXED -eq 1 ]; then
        echo -e "${YELLOW}⚠️  注意：仍有需要手动修复的错误${NC}"
        echo "请查看上面的错误信息，手动编辑文件后重新提交"
    fi
else
    echo -e "${YELLOW}⚠️  没有自动修复的内容${NC}"
    echo ""
    echo -e "${RED}需要手动修复的错误：${NC}"
    echo "1. TypeScript 类型错误 - 编辑对应 .ts/.tsx 文件"
    echo "2. 测试失败 - 检查测试逻辑"
    echo ""
    echo "修复后运行："
    echo "  git add -A"
    echo "  git commit -m 'fix: resolve CI errors'"
    echo "  git push origin $BRANCH"
fi
