#!/bin/bash
# scripts/check-github-ci.sh
# 获取 GitHub CI 状态和错误信息

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "========================================"
echo "  GitHub CI 状态检查"
echo "========================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查 gh 是否安装
check_gh_installed() {
    if ! command -v gh &> /dev/null; then
        echo -e "${RED}❌ GitHub CLI (gh) 未安装${NC}"
        echo ""
        echo "安装方法:"
        echo "  Windows: winget install GitHub.cli"
        echo "  或访问：https://cli.github.com/"
        echo ""
        exit 1
    fi
}

# 检查是否已认证
check_gh_auth() {
    if ! gh auth status &> /dev/null; then
        echo -e "${RED}❌ GitHub CLI 未认证${NC}"
        echo ""
        echo "运行以下命令进行认证:"
        echo "  gh auth login"
        echo ""
        exit 1
    fi
}

# 获取当前分支名称
get_current_branch() {
    git branch --show-current
}

# 获取远程仓库信息
get_repo_info() {
    gh repo view --json nameWithOwner -q '.nameWithOwner'
}

# 显示最近的 CI 运行记录
show_recent_runs() {
    local branch=$1
    
    echo -e "${BLUE}📊 分支 '$branch' 的最近 CI 运行记录:${NC}"
    echo ""
    
    gh run list --branch "$branch" --limit 5 --json status,conclusion,displayName,createdAt,headBranch | \
    jq -r '.[] | "  \(.displayName): \(.status) - \(.conclusion // "running") (\(.createdAt | split("T")[0]))"'
    
    echo ""
}

# 显示当前运行的 CI
show_running_workflows() {
    local branch=$1
    
    echo -e "${BLUE}🔄 正在运行的工作流:${NC}"
    echo ""
    
    gh run list --branch "$branch" --status in_progress --json displayName,createdAt | \
    jq -r '.[] | "  \(.displayName) - 开始于 \(.createdAt | split("T")[0])"'
    
    echo ""
}

# 显示失败的 CI 运行
show_failed_runs() {
    local branch=$1
    
    echo -e "${RED}❌ 失败的 CI 运行:${NC}"
    echo ""
    
    gh run list --branch "$branch" --status completed --conclusion failure --limit 3 --json displayName,createdAt | \
    jq -r '.[] | "  \(.displayName) - \(.createdAt | split("T")[0])"'
    
    echo ""
}

# 显示最近一次运行的详细信息
show_last_run_details() {
    local branch=$1
    
    echo -e "${BLUE}📋 最近一次运行详情:${NC}"
    echo ""
    
    local run_id=$(gh run list --branch "$branch" --limit 1 --json databaseId -q '.[0].databaseId')
    
    if [ -z "$run_id" ]; then
        echo "  没有运行记录"
        echo ""
        return
    fi
    
    gh run view "$run_id" --json status,conclusion,startedAt,updatedAt | \
    jq -r '"  状态：\(.status)\n  结果：\(.conclusion // "N/A")\n  开始：\(.startedAt)\n  更新：\(.updatedAt)"'
    
    echo ""
}

# 显示失败任务的日志
show_failure_logs() {
    local branch=$1
    
    echo -e "${RED}📄 最近失败日志:${NC}"
    echo ""
    
    local run_id=$(gh run list --branch "$branch" --status completed --conclusion failure --limit 1 --json databaseId -q '.[0].databaseId')
    
    if [ -z "$run_id" ]; then
        echo "  没有失败的运行记录"
        echo ""
        return
    fi
    
    echo "运行 ID: $run_id"
    echo ""
    
    # 获取失败的 job
    gh run view "$run_id" --json jobs --jq '.jobs[] | select(.conclusion == "failure") | .name' | while read job_name; do
        echo -e "${YELLOW}失败的任务：$job_name${NC}"
        echo ""
        
        # 获取日志（只获取最后 50 行）
        gh run view "$run_id" --log --job "$job_name" 2>/dev/null | tail -50 || {
            echo "  无法获取日志，请手动查看："
            echo "  gh run view $run_id --log --job \"$job_name\""
        }
        echo ""
    done
}

# 显示所有 PR 的 CI 状态
show_all_pr_ci_status() {
    echo -e "${BLUE}📊 所有开放 PR 的 CI 状态:${NC}"
    echo ""
    
    gh pr list --state open --json number,title,headRefName,checkRuns | \
    jq -r '.[] | 
        "PR #\(.number): \(.title)\n" +
        "  分支：\(.headRefName)\n" +
        "  CI 状态：\([.checkRuns[] | select(.status == "COMPLETED") | .conclusion] | 
            if length == 0 then "待运行"
            elif all(. == "SUCCESS") then "✅ 通过"
            elif any(. == "FAILURE") then "❌ 失败"
            else "⚠️ 部分通过"
            end
        )\n"'
    
    echo ""
}

# 生成修复建议
generate_fix_suggestions() {
    local branch=$1
    
    echo -e "${BLUE}💡 修复建议:${NC}"
    echo ""
    
    local last_conclusion=$(gh run list --branch "$branch" --limit 1 --json conclusion -q '.[0].conclusion')
    
    if [ "$last_conclusion" == "failure" ]; then
        echo "检测到 CI 失败，建议执行以下步骤:"
        echo ""
        echo "1. 查看详细日志:"
        echo "   gh run view --log --failed"
        echo ""
        echo "2. 拉取最新代码:"
        echo "   git pull origin $branch"
        echo ""
        echo "3. 运行本地 CI 检查:"
        echo "   bash scripts/local-ci-check.sh"
        echo ""
        echo "4. 尝试自动修复:"
        echo "   # 前端"
        echo "   cd apps/web && npm run lint:fix"
        echo "   "
        echo "   # 后端"
        echo "   cd apps/ai-service && ruff check --fix ."
        echo ""
        echo "5. 提交修复并推送:"
        echo "   git add -A"
        echo "   git commit -m 'fix: resolve CI failures'"
        echo "   git push origin $branch"
        echo ""
    else
        echo "✅ CI 状态正常！"
        echo ""
    fi
}

# 主流程
main() {
    check_gh_installed
    check_gh_auth
    
    local branch=$(get_current_branch)
    local repo=$(get_repo_info)
    
    echo -e "${GREEN}📦 仓库：$repo${NC}"
    echo -e "${GREEN}🌿 分支：$branch${NC}"
    echo ""
    
    case "$1" in
        "--all")
            show_all_pr_ci_status
            ;;
        "--logs")
            show_failure_logs "$branch"
            ;;
        "--fix")
            generate_fix_suggestions "$branch"
            ;;
        "--help"|"-h")
            echo "用法：bash scripts/check-github-ci.sh [选项]"
            echo ""
            echo "选项:"
            echo "  --all     显示所有 PR 的 CI 状态"
            echo "  --logs    显示失败日志"
            echo "  --fix     生成修复建议"
            echo "  --help    显示此帮助信息"
            echo ""
            echo "示例:"
            echo "  bash scripts/check-github-ci.sh          # 查看当前分支状态"
            echo "  bash scripts/check-github-ci.sh --all    # 查看所有 PR"
            echo "  bash scripts/check-github-ci.sh --logs   # 查看失败日志"
            echo "  bash scripts/check-github-ci.sh --fix    # 获取修复建议"
            exit 0
            ;;
        *)
            show_recent_runs "$branch"
            show_running_workflows "$branch"
            show_failed_runs "$branch"
            show_last_run_details "$branch"
            generate_fix_suggestions "$branch"
            ;;
    esac
}

main "$@"
