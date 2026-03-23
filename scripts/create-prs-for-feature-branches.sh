#!/bin/bash
# scripts/create-prs-for-feature-branches.sh
# 为所有 feature 分支创建 PR（如果不存在）

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Creating PRs for feature branches${NC}"
echo -e "${GREEN}=========================================${NC}"

# Feature 分支列表
FEATURE_BRANCHES=(
  "feature/phase-7-admin"
  "feature/phase-8-scene-generator"
)

# PR 标题映射
declare -A PR_TITLES
PR_TITLES["feature/phase-7-admin"]="Phase 7 - 管理后台开发"
PR_TITLES["feature/phase-8-scene-generator"]="Phase 8 - 动态场景生成器"

for branch in "${FEATURE_BRANCHES[@]}"; do
  echo -e "${YELLOW}Processing: $branch${NC}"

  # 检查分支是否存在
  if ! git rev-parse --verify "$branch" &>/dev/null; then
    echo -e "${RED}Branch $branch does not exist, skipping${NC}"
    continue
  fi

  # 推送到远程
  git push origin "$branch" 2>&1 || true

  # 使用 GitHub CLI 创建 PR（如果已安装）
  if command -v gh &> /dev/null; then
    # 检查 PR 是否已存在
    existing_pr=$(gh pr list --head "$branch" --base main --state open --json number --jq '.[0].number' 2>/dev/null || echo "")

    if [ -n "$existing_pr" ]; then
      echo -e "${GREEN}PR #$existing_pr already exists for $branch${NC}"
    else
      title="${PR_TITLES[$branch]}"
      pr_number=$(gh pr create \
        --title "$title" \
        --body "## Changes
This PR contains updates from \`${branch}\`.

### Checklist
- [ ] Code compiles without errors
- [ ] Tests pass (npm test, pytest)
- [ ] ESLint/Ruff checks pass
- [ ] No new security vulnerabilities

### Auto-generated
Created by GitHub Actions on push to feature branch.

<!-- auto-merge -->" \
        --base main \
        --head "$branch" \
        --label "auto-merge" \
        --json number \
        --jq '.number')
      echo -e "${GREEN}Created PR #$pr_number for $branch${NC}"
    fi
  else
    echo -e "${YELLOW}gh CLI not installed. Please create PR manually:${NC}"
    echo "  https://github.com/eyangisgod-cell/visual-multi-agent-pbl/compare/main...$branch?expand=1"
  fi
done

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}PR creation process completed${NC}"
echo -e "${GREEN}=========================================${NC}"
