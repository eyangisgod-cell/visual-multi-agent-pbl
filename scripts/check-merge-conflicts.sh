#!/bin/bash
# scripts/check-merge-conflicts.sh
# 检查所有 feature 分支与 main 的合并冲突

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "Checking merge conflicts with main"
echo "=========================================="

# 获取 main 分支最新状态
git fetch origin main:main --force 2>/dev/null || true

# 要检查的分支列表
BRANCHES=(
  "feature/phase-0-setup"
  "feature/phase-2-pixijs"
  "feature/phase-3-agent-render"
  "feature/phase-4-ag2-agents"
  "feature/phase-5-project-tasks"
)

CONFLICT_BRANCHES=()
CLEAN_BRANCHES=()

for branch in "${BRANCHES[@]}"; do
  # 检查本地是否存在该分支
  if ! git rev-parse --verify "$branch" &>/dev/null; then
    # 检查远程分支
    if git rev-parse --verify "origin/$branch" &>/dev/null; then
      echo -e "${YELLOW}Fetching $branch from remote...${NC}"
      git fetch origin "$branch:$branch" --force 2>/dev/null || continue
    else
      echo -e "${YELLOW}Skipping $branch - not found${NC}"
      continue
    fi
  fi

  echo -e "\nChecking ${branch}..."

  # 尝试 dry-run merge
  git checkout --quiet main
  if git merge --no-commit --no-ff --quiet "$branch" 2>/dev/null; then
    # 合并成功，清理
    git merge --abort &>/dev/null || true
    echo -e "${GREEN}✓ ${branch} - No conflicts detected${NC}"
    CLEAN_BRANCHES+=("$branch")
  else
    # 合并失败，有冲突
    git merge --abort &>/dev/null || true
    echo -e "${RED}✗ ${branch} - Conflicts detected!${NC}"
    CONFLICT_BRANCHES+=("$branch")
  fi
done

# 返回原始分支
git checkout --quiet - 2>/dev/null || true

echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="

if [ ${#CLEAN_BRANCHES[@]} -gt 0 ]; then
  echo -e "${GREEN}Clean branches (${#CLEAN_BRANCHES[@]}):${NC}"
  for b in "${CLEAN_BRANCHES[@]}"; do
    echo -e "  ${GREEN}✓${NC} $b"
  done
fi

if [ ${#CONFLICT_BRANCHES[@]} -gt 0 ]; then
  echo -e "${RED}Branches with conflicts (${#CONFLICT_BRANCHES[@]}):${NC}"
  for b in "${CONFLICT_BRANCHES[@]}"; do
    echo -e "  ${RED}✗${NC} $b"
  done
  echo ""
  echo -e "${YELLOW}Recommendation: Merge clean branches first, then resolve conflicts manually${NC}"
else
  echo -e "${GREEN}All branches can be merged without conflicts!${NC}"
fi

echo "=========================================="

# 输出用于 GitHub Actions 的结果
echo "conflict_branches=${CONFLICT_BRANCHES[*]}" >> $GITHUB_OUTPUT 2>/dev/null || true
echo "clean_branches=${CLEAN_BRANCHES[*]}" >> $GITHUB_OUTPUT 2>/dev/null || true

# 如果有冲突分支，返回非零退出码
if [ ${#CONFLICT_BRANCHES[@]} -gt 0 ]; then
  exit 1
fi
