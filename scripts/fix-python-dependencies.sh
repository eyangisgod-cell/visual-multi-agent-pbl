#!/bin/bash
# scripts/fix-python-dependencies.sh
# 自动修复 Python 依赖冲突问题

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "========================================"
echo "  Python 依赖冲突自动修复工具"
echo "========================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查 Python 是否安装
check_python() {
    if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
        echo -e "${RED}❌ Python 未安装${NC}"
        echo "请先安装 Python 3.11+"
        exit 1
    fi
    
    if command -v python3 &> /dev/null; then
        PYTHON_CMD=python3
    else
        PYTHON_CMD=python
    fi
    
    echo -e "${GREEN}✅ 使用 Python: $($PYTHON_CMD --version)${NC}"
    echo ""
}

# 检查 pip 是否安装
check_pip() {
    if ! $PYTHON_CMD -m pip --version &> /dev/null; then
        echo -e "${YELLOW}⚠️  pip 未安装，正在安装...${NC}"
        $PYTHON_CMD -m ensurepip --upgrade
    fi
    
    echo -e "${GREEN}✅ 使用 pip: $($PYTHON_CMD -m pip --version)${NC}"
    echo ""
}

# 备份 requirements.txt
backup_requirements() {
    local file=$1
    local backup="${file}.backup.$(date +%Y%m%d%H%M%S)"
    cp "$file" "$backup"
    echo -e "${BLUE}📦 已备份：$backup${NC}"
}

# 修复 phase-3 的 requirements.txt
fix_phase3_requirements() {
    local file="phase-3/apps/ai-service/requirements.txt"
    
    if [ ! -f "$file" ]; then
        echo -e "${YELLOW}⚠️  文件不存在：$file${NC}"
        return
    fi
    
    echo "========================================"
    echo "  修复 phase-3 requirements.txt"
    echo "========================================"
    echo ""
    
    backup_requirements "$file"
    
    echo -e "${BLUE}📝 分析依赖冲突...${NC}"
    echo ""
    
    # 读取当前文件内容
    local content=$(cat "$file")
    
    # 修复 pydantic 版本冲突
    # pyautogen 需要 pydantic>=2.6.1，所以升级到 2.6.1
    echo -e "${YELLOW}修复 pydantic 版本：2.5.3 → 2.6.1${NC}"
    sed -i.bak 's/pydantic==2.5.3/pydantic==2.6.1/g' "$file"
    sed -i.bak 's/pydantic-settings==2.1.0/pydantic-settings==2.2.0/g' "$file"
    
    # 清理备份文件
    rm -f "${file}.bak"
    
    echo -e "${GREEN}✅ 已更新 $file${NC}"
    echo ""
    
    # 显示修改
    echo -e "${BLUE}📋 修改内容:${NC}"
    if command -v git &> /dev/null; then
        git diff "$file" || true
    else
        grep "pydantic" "$file"
    fi
    echo ""
}

# 修复主分支 requirements.txt
fix_main_requirements() {
    local file="apps/ai-service/requirements.txt"
    
    if [ ! -f "$file" ]; then
        echo -e "${YELLOW}⚠️  文件不存在：$file${NC}"
        return
    fi
    
    echo "========================================"
    echo "  修复主分支 requirements.txt"
    echo "========================================"
    echo ""
    
    backup_requirements "$file"
    
    echo -e "${BLUE}📝 分析依赖冲突...${NC}"
    echo ""
    
    # 修复 pydantic 版本冲突
    echo -e "${YELLOW}修复 pydantic 版本：2.5.3 → 2.6.1${NC}"
    sed -i.bak 's/pydantic==2.5.3/pydantic==2.6.1/g' "$file"
    sed -i.bak 's/pydantic-settings==2.1.0/pydantic-settings==2.2.0/g' "$file"
    
    # 清理备份文件
    rm -f "${file}.bak"
    
    echo -e "${GREEN}✅ 已更新 $file${NC}"
    echo ""
    
    # 显示修改
    echo -e "${BLUE}📋 修改内容:${NC}"
    if command -v git &> /dev/null; then
        git diff "$file" || true
    else
        grep "pydantic" "$file"
    fi
    echo ""
}

# 验证依赖是否可以安装
verify_dependencies() {
    local dir=$1
    
    echo "========================================"
    echo "  验证依赖安装"
    echo "========================================"
    echo ""
    
    cd "$dir"
    
    # 创建虚拟环境（如果不存在）
    if [ ! -d "venv" ]; then
        echo -e "${BLUE}📦 创建虚拟环境...${NC}"
        $PYTHON_CMD -m venv venv
    fi
    
    # 激活虚拟环境
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        source venv/Scripts/activate
    else
        source venv/bin/activate
    fi
    
    echo -e "${GREEN}✅ 虚拟环境已激活${NC}"
    echo ""
    
    # 升级 pip
    echo -e "${BLUE}📦 升级 pip...${NC}"
    pip install --upgrade pip
    
    # 尝试安装依赖（只解析，不实际安装）
    echo -e "${BLUE}📦 验证依赖解析...${NC}"
    pip install --dry-run -r requirements.txt || {
        echo -e "${RED}❌ 依赖解析失败${NC}"
        echo "请手动检查 requirements.txt"
        deactivate
        cd ..
        return 1
    }
    
    echo -e "${GREEN}✅ 依赖验证通过${NC}"
    echo ""
    
    # 退出虚拟环境
    deactivate
    cd ..
}

# 显示依赖冲突分析
analyze_conflicts() {
    local file=$1
    
    echo "========================================"
    echo "  依赖冲突分析"
    echo "========================================"
    echo ""
    
    if [ ! -f "$file" ]; then
        echo -e "${YELLOW}⚠️  文件不存在：$file${NC}"
        return
    fi
    
    echo -e "${BLUE}📋 当前 pydantic 相关依赖:${NC}"
    grep "pydantic" "$file"
    echo ""
    
    echo -e "${BLUE}📋 已知冲突:${NC}"
    echo "  - pyautogen 0.7.5 需要 pydantic>=2.6.1"
    echo "  - 当前指定 pydantic==2.5.3"
    echo ""
    
    echo -e "${YELLOW}💡 解决方案:${NC}"
    echo "  升级 pydantic 到 2.6.1 或更高版本"
    echo ""
}

# 主流程
main() {
    echo -e "${BLUE}🔧 Python 依赖冲突自动修复工具${NC}"
    echo ""
    
    check_python
    check_pip
    
    case "$1" in
        "--analyze")
            analyze_conflicts "phase-3/apps/ai-service/requirements.txt"
            analyze_conflicts "apps/ai-service/requirements.txt"
            ;;
        "--verify")
            verify_dependencies "phase-3/apps/ai-service"
            ;;
        "--phase3")
            fix_phase3_requirements
            verify_dependencies "phase-3/apps/ai-service"
            ;;
        "--main")
            fix_main_requirements
            verify_dependencies "apps/ai-service"
            ;;
        "--all")
            fix_phase3_requirements
            fix_main_requirements
            echo -e "${GREEN}✅ 所有修复完成！${NC}"
            echo ""
            echo "请运行以下命令验证："
            echo "  git diff"
            echo "  git add -A"
            echo "  git commit -m 'fix: resolve pydantic dependency conflicts'"
            echo "  git push"
            ;;
        "--help"|"-h")
            echo "用法：bash scripts/fix-python-dependencies.sh [选项]"
            echo ""
            echo "选项:"
            echo "  --analyze   分析依赖冲突"
            echo "  --phase3    只修复 phase-3 分支"
            echo "  --main      只修复主分支"
            echo "  --all       修复所有分支"
            echo "  --verify    验证依赖安装"
            echo "  --help      显示此帮助信息"
            echo ""
            echo "示例:"
            echo "  bash scripts/fix-python-dependencies.sh --analyze"
            echo "  bash scripts/fix-python-dependencies.sh --phase3"
            echo "  bash scripts/fix-python-dependencies.sh --all"
            exit 0
            ;;
        *)
            # 默认修复所有
            fix_phase3_requirements
            fix_main_requirements
            echo -e "${GREEN}✅ 所有修复完成！${NC}"
            ;;
    esac
}

main "$@"
