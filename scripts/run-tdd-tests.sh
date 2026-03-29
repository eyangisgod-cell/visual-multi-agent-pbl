#!/bin/bash
# scripts/run-tdd-tests.sh
# Test-Driven Development 测试脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WEB_DIR="$SCRIPT_DIR/../apps/web"

cd "$WEB_DIR"

echo "========================================"
echo "  TDD Test Runner"
echo "========================================"
echo ""

# 获取修改的文件
echo "📊 检测修改的文件..."
CHANGED_FILES=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null || git diff HEAD --name-only 2>/dev/null || echo "")

if [ -z "$CHANGED_FILES" ]; then
    echo "⚠️  没有检测到修改的文件"
    echo "   运行所有测试..."
    npm run test
    exit $?
fi

echo "修改的文件:"
echo "$CHANGED_FILES" | while read file; do echo "  - $file"; done
echo ""

# 分析修改的文件类型
RUN_COMPONENT_TESTS=false
RUN_API_TESTS=false
RUN_UTILS_TESTS=false
RUN_ALL_TESTS=false

for file in $CHANGED_FILES; do
    if [[ $file == *src/components/*.tsx ]] || [[ $file == *src/components/*.ts ]]; then
        RUN_COMPONENT_TESTS=true
        echo "🎨 检测到组件修改：$file"
    fi
    
    if [[ $file == *src/app/api/* ]]; then
        RUN_API_TESTS=true
        echo "🔌 检测到 API 修改：$file"
    fi
    
    if [[ $file == *src/lib/* ]] || [[ $file == *src/utils/* ]]; then
        RUN_UTILS_TESTS=true
        echo "🛠️  检测到工具函数修改：$file"
    fi
    
    if [[ $file == *.test.tsx ]] || [[ $file == *.test.ts ]]; then
        echo "🧪 检测到测试文件修改：$file"
        # 运行特定的测试文件
        npm run test -- "$file"
        exit $?
    fi
done

echo ""
echo "========================================"
echo "  运行测试"
echo "========================================"
echo ""

# 运行组件测试
if [ "$RUN_COMPONENT_TESTS" = true ]; then
    echo "运行组件测试..."
    npm run test -- --testPathPattern="components" --passWithNoTests || {
        echo "❌ 组件测试失败"
        exit 1
    }
fi

# 运行 API 测试
if [ "$RUN_API_TESTS" = true ]; then
    echo "运行 API 测试..."
    npm run test -- --testPathPattern="api" --passWithNoTests || {
        echo "❌ API 测试失败"
        exit 1
    }
fi

# 运行工具函数测试
if [ "$RUN_UTILS_TESTS" = true ]; then
    echo "运行工具函数测试..."
    npm run test -- --testPathPattern="(utils|lib)" --passWithNoTests || {
        echo "❌ 工具函数测试失败"
        exit 1
    }
fi

# 如果没有检测到特定类型，运行所有测试
if [ "$RUN_COMPONENT_TESTS" = false ] && \
   [ "$RUN_API_TESTS" = false ] && \
   [ "$RUN_UTILS_TESTS" = false ]; then
    echo "运行所有测试..."
    npm run test -- --passWithNoTests || {
        echo "❌ 测试失败"
        exit 1
    }
fi

echo ""
echo "========================================"
echo "  ✅ 所有测试通过"
echo "========================================"
echo ""

exit 0
