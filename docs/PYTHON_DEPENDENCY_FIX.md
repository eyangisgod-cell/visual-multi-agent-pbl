# Python 依赖冲突修复指南

## 🔴 问题描述

### CI 报错信息

```
ERROR: Cannot install -r requirements.txt because these package versions have conflicting dependencies.

The conflict is caused by:
    The user requested pydantic==2.5.3
    fastapi 0.109.0 depends on pydantic!=1.8, !=1.8.1, !=2.0.0, !=2.0.1, !=2.1.0, <3.0.0 and >=1.7.4
    pydantic-settings 2.1.0 depends on pydantic>=2.3.0
    langchain 0.1.0 depends on pydantic<3 and >=1
    pyautogen 0.7.5 depends on pydantic<3 and >=2.6.1  ← 冲突！

Additionally, some packages in these conflicts have no matching distributions 
available for your environment:
    pydantic
```

---

## 🔍 问题分析

### 冲突原因

| 包 | 需要的 pydantic 版本 | 实际指定 |
|------|---------------------|----------|
| **用户指定** | `==2.5.3` | 2.5.3 |
| **fastapi 0.109.0** | `>=1.7.4, <3.0.0` | ✅ 兼容 |
| **pydantic-settings 2.1.0** | `>=2.3.0` | ✅ 兼容 |
| **langchain 0.1.0** | `>=1, <3` | ✅ 兼容 |
| **pyautogen 0.7.5** | `>=2.6.1, <3` | ❌ **不兼容！** |

### 根本原因

**pyautogen 0.7.5** 需要 **pydantic >= 2.6.1**，但 `requirements.txt` 指定了 **pydantic == 2.5.3**

---

## ✅ 解决方案

### 方案 1: 自动修复（推荐）

```bash
# 使用自动修复脚本
bash scripts/fix-python-dependencies.sh --all
```

### 方案 2: 手动修复

**修改 `requirements.txt`**：

```diff
# apps/ai-service/requirements.txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6
- pydantic==2.5.3
- pydantic-settings==2.1.0
+ pydantic==2.6.1
+ pydantic-settings==2.2.0
python-dotenv==1.0.0
# ... 其他依赖
```

**验证修复**：

```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 升级 pip
pip install --upgrade pip

# 验证依赖可以安装
pip install --dry-run -r requirements.txt

# 如果成功，实际安装
pip install -r requirements.txt
```

---

## 🛠️ 自动化修复工具

### 脚本 1: fix-python-dependencies.sh

**用途**: 自动修复 Python 依赖版本冲突

**用法**：

```bash
# 分析依赖冲突
bash scripts/fix-python-dependencies.sh --analyze

# 修复 phase-3 分支
bash scripts/fix-python-dependencies.sh --phase3

# 修复主分支
bash scripts/fix-python-dependencies.sh --main

# 修复所有分支
bash scripts/fix-python-dependencies.sh --all

# 验证依赖安装
bash scripts/fix-python-dependencies.sh --verify
```

### 脚本 2: fix-ci-errors-from-github.sh

**用途**: 从 GitHub 读取 CI 错误并自动修复

**用法**：

```bash
# 安装 GitHub CLI（如果未安装）
winget install GitHub.cli
gh auth login

# 查看失败日志
bash scripts/fix-ci-errors-from-github.sh --logs

# 分析错误
bash scripts/fix-ci-errors-from-github.sh --analyze

# 自动修复
bash scripts/fix-ci-errors-from-github.sh --fix
```

---

## 📋 完整修复流程

### 本地修复流程

```bash
# 1. 切换到项目根目录
cd e:\my-project\visual-multi-agent-pbl

# 2. 运行自动修复脚本
bash scripts/fix-python-dependencies.sh --phase3

# 3. 验证修复
bash scripts/fix-python-dependencies.sh --verify

# 4. 提交修复
git add -A
git commit -m "fix: resolve pydantic dependency conflicts"
git push origin feature/phase-3-agent-render
```

### 从 GitHub 读取错误并修复

```bash
# 1. 安装 GitHub CLI
winget install GitHub.cli
gh auth login

# 2. 查看 CI 错误
bash scripts/fix-ci-errors-from-github.sh --logs

# 3. 自动修复
bash scripts/fix-ci-errors-from-github.sh --fix

# 4. 提交修复
git add -A
git commit -m "fix: auto-fix CI errors from GitHub"
git push
```

---

## 🎯 依赖版本兼容性参考

### 推荐的依赖版本组合

```txt
# 核心框架
fastapi==0.109.0
uvicorn[standard]==0.27.0

# Pydantic 系列（必须兼容）
pydantic==2.6.1          # >= 2.6.1 以兼容 pyautogen
pydantic-settings==2.2.0  # 兼容 pydantic 2.6.1

# AI/LLM 框架
langchain==0.1.0
langchain-community==0.0.10
llama-index==0.9.44
pyautogen[openai]==0.7.5  # 需要 pydantic>=2.6.1

# 数据库
asyncpg==0.29.0
sqlalchemy==2.0.25
alembic==1.13.1
psycopg2-binary==2.9.9

# 缓存
redis==5.0.1

# 对象存储
minio==7.2.3

# 向量搜索
sentence-transformers==2.3.1

# HTTP 客户端
aiohttp==3.9.1
websockets==12.0
litellm==1.28.0

# 安全
bcrypt==4.1.2
python-jose[cryptography]==3.3.0

# 工具
python-multipart==0.0.6
python-dotenv==1.0.0
```

---

## 🧪 验证步骤

### 1. 本地验证

```bash
# 创建虚拟环境
cd apps/ai-service
python -m venv venv

# 激活虚拟环境
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# 升级 pip
pip install --upgrade pip

# 安装依赖
pip install -r requirements.txt

# 验证安装成功
python -c "import fastapi; import pydantic; import pyautogen; print('✅ 所有依赖安装成功')"

# 退出虚拟环境
deactivate
```

### 2. CI 验证

推送后，GitHub Actions 会自动运行：

```
1. AI Service - Pytest
   - 安装依赖
   - 运行测试

2. AI Service - Pyright & Ruff
   - 类型检查
   - 代码质量检查
```

---

## 📚 相关文档

| 文档 | 说明 |
|------|------|
| [`CI_CD_SUMMARY.md`](file://e:\my-project\visual-multi-agent-pbl\docs\CI_CD_SUMMARY.md) | CI/CD 问题总结 |
| [`CI_CD_QUICK_REFERENCE.md`](file://e:\my-project\visual-multi-agent-pbl\docs\CI_CD_QUICK_REFERENCE.md) | 快速参考指南 |
| [`CI_CD_DETAILED_ANALYSIS.md`](file://e:\my-project\visual-multi-agent-pbl\docs\CI_CD_DETAILED_ANALYSIS.md) | 详细分析 |

---

## 🔧 故障排除

### 问题 1: 仍然报告依赖冲突

**可能原因**: 缓存问题

**解决方案**：

```bash
# 清除 pip 缓存
pip cache purge

# 重新安装
pip install --no-cache-dir -r requirements.txt
```

### 问题 2: CI 仍然失败

**可能原因**: GitHub Actions 缓存

**解决方案**：

```bash
# 在 GitHub Actions 中清除缓存
# 访问：https://github.com/<owner>/<repo>/actions/caches
# 删除相关缓存

# 或强制重新安装
# 修改 .github/workflows/ci-cd.yml 添加：
- name: Clear pip cache
  run: pip cache purge
```

### 问题 3: 本地安装成功但 CI 失败

**可能原因**: 环境差异（Windows vs Linux）

**解决方案**：

```bash
# 使用 Docker 模拟 CI 环境
docker run -it --rm -v $(pwd):/app -w /app python:3.11 bash

# 在容器内安装
pip install -r apps/ai-service/requirements.txt
```

---

## 💡 最佳实践

### 1. 使用版本范围而非固定版本

```txt
# ❌ 不推荐（太严格）
pydantic==2.6.1

# ✅ 推荐（允许小版本更新）
pydantic>=2.6.1,<3.0.0
```

### 2. 定期更新依赖

```bash
# 使用 pip-review 检查可更新的包
pip install pip-review
pip-review --local

# 自动更新
pip-review --auto
```

### 3. 锁定依赖版本

```bash
# 生成精确的依赖锁定文件
pip freeze > requirements.lock.txt

# CI 使用锁定文件
pip install -r requirements.lock.txt
```

### 4. 使用依赖检查工具

```bash
# 检查依赖冲突
pip install pip-tools
pip-compile requirements.in

# 检查安全漏洞
pip install safety
safety check -r requirements.txt
```

---

## 📞 需要帮助？

### 查看依赖树

```bash
pip install pipdeptree
pipdeptree
```

### 分析特定包的依赖

```bash
pip show pyautogen
pip show pydantic
```

### 检查兼容性

```bash
pip install pip-compile
pip-compile --upgrade
```

---

**最后更新**: 2026-03-23  
**维护者**: Development Team
