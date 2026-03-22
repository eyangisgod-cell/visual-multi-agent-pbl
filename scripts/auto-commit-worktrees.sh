#!/bin/bash
# scripts/auto-commit-worktrees.sh
# 定时检查并提交所有 worktrees 的更改

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKTREES_DIR="$REPO_ROOT/.worktrees"
LOG_FILE="$REPO_ROOT/logs/auto-commit.log"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 确保日志目录存在
mkdir -p "$(dirname "$LOG_FILE")"

log "=========================================="
log "Starting auto-commit check for worktrees"
log "=========================================="

# Worktree 列表
WORKTREES=("phase-0" "phase-2" "phase-3" "phase-4" "phase-5")

for wt in "${WORKTREES[@]}"; do
    WT_PATH="$WORKTREES_DIR/$wt"

    if [ ! -d "$WT_PATH" ]; then
        log "${YELLOW}Skipping $wt - directory not found${NC}"
        continue
    fi

    cd "$WT_PATH"

    # 检查是否有未提交的更改
    if git status --porcelain | grep -q .; then
        log "${YELLOW}[$wt] Changes detected:${NC}"
        git status --short

        # 检查是否有暂存的更改
        if ! git diff --cached --quiet; then
            # 获取变更的文件列表
            FILES=$(git diff --cached --name-only | head -5 | tr '\n' ', ' | sed 's/,$//')

            # 确定提交信息前缀
            if git diff --cached --name-only | grep -q '\.test\.\|_test\.'; then
                PREFIX="test"
            elif git diff --cached --name-only | grep -q '\.md$'; then
                PREFIX="docs"
            elif git diff --cached --name-only | grep -q '\.config\.\|\.yml$'; then
                PREFIX="chore"
            else
                PREFIX="feat"
            fi

            # 自动提交
            git commit -m "$(echo "$PREFIX($wt): auto-commit $(date '+%Y-%m-%d %H:%M')" | head -c 72)"
            log "${GREEN}[$wt] Committed successfully${NC}"

            # 推送到远程（如果已设置上游分支）
            if git rev-parse --abbrev-ref --symbolic-full-name @{u} &>/dev/null; then
                git push
                log "${GREEN}[$wt] Pushed to remote${NC}"
            else
                log "${YELLOW}[$wt] No upstream branch configured, skipping push${NC}"
            fi
        else
            # 有未暂存的更改，先暂存
            git add -A
            log "${YELLOW}[$wt] Staged all changes${NC}"
        fi
    else
        log "${GREEN}[$wt] No changes to commit${NC}"
    fi
done

log "=========================================="
log "Auto-commit check completed"
log "=========================================="
