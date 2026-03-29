#!/bin/bash
# scripts/quick-check.sh
# 快速检查（仅修改的文件）- 不阻止提交

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

WEB_DIR="$SCRIPT_DIR/../apps/web"

echo "========================================"
echo "  快速检查（仅修改的文件）"
echo "========================================"
echo ""

# 获取修改的文件（暂存的或工作区的）
MODIFIED_TS=$(git diff --staged --name-only -- '*.ts' '*.tsx' 2>/dev/null || \
              git diff --name-only -- '*.ts' '*.tsx' 2>/dev/null || \
              echo "")

if [ -z "$MODIFIED_TS" ]; then
    echo "✅ 没有 TypeScript 文件修改"
    exit 0
fi

cd "$WEB_DIR"

echo "📝 检查文件:"
echo "$MODIFIED_TS" | while read file; do
    # 移除 apps/web/ 前缀
    file_clean="${file#apps/web/}"
    echo "  - $file_clean"
done
echo ""

# TypeScript 检查（只警告）
echo "1️⃣  TypeScript 检查（修改文件）..."
ERRORS=$(echo "$MODIFIED_TS" | xargs npx tsc --noEmit 2>&1 || true)
if [ -n "$ERRORS" ]; then
    echo -e "\033[1;33m⚠️  TypeScript 错误：\033[0m"
    echo "$ERRORS" | head -20
    echo ""
    echo "提示：运行 'npx tsc --noEmit' 查看完整错误"
else
    echo "✅ TypeScript 检查通过"
fi
echo ""

# ESLint 检查（只警告）
echo "2️⃣  ESLint 检查（修改文件）..."
LINT_ERRORS=$(echo "$MODIFIED_TS" | xargs npx eslint 2>&1 || true)
if [ -n "$LINT_ERRORS" ]; then
    echo -e "\033[1;33m⚠️  ESLint 错误：\033[0m"
    echo "$LINT_ERRORS" | head -20
    echo ""
    echo "提示：运行 'npm run lint:fix' 尝试自动修复"
else
    echo "✅ ESLint 检查通过"
fi
echo ""

echo "========================================"
echo "  快速检查完成"
echo "========================================"
echo ""
echo "⚠️  以上错误不会阻止提交，但建议修复"
echo ""
echo "推送前可选："
echo "  git push origin <branch>"
echo ""
echo "查看 GitHub CI 状态："
echo "  gh run list --branch \$(git branch --show-current)"
echo ""
