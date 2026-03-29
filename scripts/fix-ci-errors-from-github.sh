#!/bin/bash
# scripts/fix-ci-errors-from-github.sh
# 从 GitHub 读取 CI 错误并自动修复

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "========================================"
echo "  GitHub CI 错误自动修复工具"
echo "========================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 检查 gh 是否安装
check_gh() {
    if ! command -v gh &> /dev/null; then
        echo -e "${RED}❌ GitHub CLI (gh) 未安装${NC}"
        echo ""
        echo "安装方法:"
        echo "  Windows: winget install GitHub.cli"
        echo "  或访问：https://cli.github.com/"
        echo ""
        exit 1
    fi
    
    if ! gh auth status &> /dev/null; then
        echo -e "${RED}❌ GitHub CLI 未认证${NC}"
        echo ""
        echo "运行以下命令进行认证:"
        echo "  gh auth login"
        echo ""
        exit 1
    fi
    
    echo -e "${GREEN}✅ GitHub CLI 已就绪${NC}"
    echo ""
}

# 获取当前分支
get_current_branch() {
    git branch --show-current
}

# 获取最近的失败运行
get_failed_run() {
    local branch=$1
    
    echo -e "${BLUE}📊 获取分支 '$branch' 的失败运行...${NC}"
    
    local run_id=$(gh run list --branch "$branch" --status completed --conclusion failure --limit 1 --json databaseId -q '.[0].databaseId')
    
    if [ -z "$run_id" ]; then
        echo -e "${YELLOW}⚠️  没有找到失败的运行${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ 找到失败运行：$run_id${NC}"
    echo "$run_id"
}

# 获取失败日志
get_failure_logs() {
    local run_id=$1
    
    echo ""
    echo -e "${BLUE}📄 获取失败日志...${NC}"
    echo ""
    
    # 获取所有失败的 job
    local failed_jobs=$(gh run view "$run_id" --json jobs --jq '.jobs[] | select(.conclusion == "failure") | .name')
    
    for job_name in $failed_jobs; do
        echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${YELLOW}失败的任务：$job_name${NC}"
        echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        
        # 获取日志
        gh run view "$run_id" --log --job "$job_name" 2>/dev/null | tail -100 || {
            echo "无法获取日志，请手动查看："
            echo "  gh run view $run_id --log --job \"$job_name\""
        }
        echo ""
    done
}

# 分析 Python 依赖错误
analyze_python_error() {
    local logs="$1"
    
    echo -e "${BLUE}🔍 分析 Python 依赖错误...${NC}"
    echo ""
    
    if echo "$logs" | grep -q "Cannot install.*pydantic"; then
        echo -e "${RED}❌ 检测到 pydantic 版本冲突${NC}"
        echo ""
        
        # 提取冲突信息
        echo -e "${BLUE}📋 冲突详情:${NC}"
        echo "$logs" | grep -A 10 "The conflict is caused by" || true
        echo ""
        
        echo -e "${YELLOW}💡 解决方案:${NC}"
        echo "  运行：bash scripts/fix-python-dependencies.sh --phase3"
        echo ""
        
        return 0
    fi
    
    if echo "$logs" | grep -q "ResolutionImpossible"; then
        echo -e "${RED}❌ 检测到依赖解析失败${NC}"
        echo ""
        echo -e "${YELLOW}💡 解决方案:${NC}"
        echo "  运行：bash scripts/fix-python-dependencies.sh --all"
        echo ""
        
        return 0
    fi
    
    return 1
}

# 分析 TypeScript 错误
analyze_typescript_error() {
    local logs="$1"
    
    echo -e "${BLUE}🔍 分析 TypeScript 错误...${NC}"
    echo ""
    
    if echo "$logs" | grep -q "error TS"; then
        echo -e "${RED}❌ 检测到 TypeScript 错误${NC}"
        echo ""
        
        # 提取错误信息
        echo -e "${BLUE}📋 错误详情:${NC}"
        echo "$logs" | grep "error TS" | head -10
        echo ""
        
        echo -e "${YELLOW}💡 解决方案:${NC}"
        echo "  1. 查看完整错误：gh run view $run_id --log"
        echo "  2. 本地运行：cd apps/web && npx tsc --noEmit"
        echo "  3. 修复类型错误后重新提交"
        echo ""
        
        return 0
    fi
    
    return 1
}

# 分析 ESLint 错误
analyze_eslint_error() {
    local logs="$1"
    
    echo -e "${BLUE}🔍 分析 ESLint 错误...${NC}"
    echo ""
    
    if echo "$logs" | grep -q "eslint"; then
        echo -e "${RED}❌ 检测到 ESLint 错误${NC}"
        echo ""
        
        echo -e "${YELLOW}💡 解决方案:${NC}"
        echo "  运行：cd apps/web && npm run lint:fix"
        echo ""
        
        return 0
    fi
    
    return 1
}

# 自动修复
auto_fix() {
    local logs="$1"
    local fixed=false
    
    echo "========================================"
    echo "  自动修复"
    echo "========================================"
    echo ""
    
    # 尝试修复 Python 依赖
    if analyze_python_error "$logs"; then
        echo -e "${BLUE}🔧 正在修复 Python 依赖...${NC}"
        bash scripts/fix-python-dependencies.sh --phase3
        fixed=true
    fi
    
    # 尝试修复 ESLint
    if analyze_eslint_error "$logs"; then
        echo -e "${BLUE}🔧 正在修复 ESLint...${NC}"
        cd apps/web && npm run lint:fix || true
        cd ..
        fixed=true
    fi
    
    if [ "$fixed" = true ]; then
        echo ""
        echo -e "${GREEN}✅ 自动修复完成！${NC}"
        echo ""
        echo "请检查修改并提交:"
        echo "  git status"
        echo "  git diff"
        echo "  git add -A"
        echo "  git commit -m 'fix: auto-fix CI errors'"
        echo "  git push"
        echo ""
    else
        echo -e "${YELLOW}⚠️  无法自动修复所有错误${NC}"
        echo ""
        echo "请手动查看日志并修复:"
        echo "  gh run view <run-id> --log"
        echo ""
    fi
}

# 主流程
main() {
    check_gh
    
    local branch=$(get_current_branch)
    
    echo -e "${BLUE}🌿 当前分支：$branch${NC}"
    echo ""
    
    case "$1" in
        "--logs")
            # 只显示日志
            local run_id=$(get_failed_run "$branch") || exit 0
            get_failure_logs "$run_id"
            ;;
        "--fix")
            # 自动修复
            local run_id=$(get_failed_run "$branch") || exit 0
            local logs=$(gh run view "$run_id" --log 2>/dev/null)
            auto_fix "$logs"
            ;;
        "--analyze")
            # 只分析
            local run_id=$(get_failed_run "$branch") || exit 0
            local logs=$(gh run view "$run_id" --log 2>/dev/null)
            
            echo "========================================"
            echo "  CI 错误分析"
            echo "========================================"
            echo ""
            
            analyze_python_error "$logs" || \
            analyze_typescript_error "$logs" || \
            analyze_eslint_error "$logs" || \
            echo -e "${YELLOW}⚠️  未识别的错误类型，请手动查看日志${NC}"
            ;;
        "--help"|"-h")
            echo "用法：bash scripts/fix-ci-errors-from-github.sh [选项]"
            echo ""
            echo "选项:"
            echo "  --logs      显示失败日志"
            echo "  --analyze   分析错误类型"
            echo "  --fix       自动修复错误"
            echo "  --help      显示此帮助信息"
            echo ""
            echo "示例:"
            echo "  bash scripts/fix-ci-errors-from-github.sh --logs"
            echo "  bash scripts/fix-ci-errors-from-github.sh --analyze"
            echo "  bash scripts/fix-ci-errors-from-github.sh --fix"
            exit 0
            ;;
        *)
            # 默认：分析并修复
            local run_id=$(get_failed_run "$branch") || exit 0
            
            echo ""
            echo -e "${BLUE}📋 运行详情:${NC}"
            gh run view "$run_id" --json status,conclusion,displayName,headBranch | jq -r '"  工作流：\(.displayName)\n  分支：\(.headBranch)\n  状态：\(.status)\n  结果：\(.conclusion)"'
            echo ""
            
            local logs=$(gh run view "$run_id" --log 2>/dev/null)
            
            echo "========================================"
            echo "  错误分析"
            echo "========================================"
            echo ""
            
            analyze_python_error "$logs" || \
            analyze_typescript_error "$logs" || \
            analyze_eslint_error "$logs" || \
            echo -e "${YELLOW}⚠️  未识别的错误类型${NC}"
            
            echo ""
            read -p "是否尝试自动修复？(y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                auto_fix "$logs"
            fi
            ;;
    esac
}

main "$@"
