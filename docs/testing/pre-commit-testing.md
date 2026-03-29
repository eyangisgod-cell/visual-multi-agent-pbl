# Pre-commit 测试自动化配置

## 概述

本文档说明如何配置 pre-commit hook 来自动运行测试，确保代码质量。

## 当前配置

### Pre-commit Hook 位置
`apps/web/.husky/pre-commit`

### 检查流程
```
1. ESLint 检查（警告，不阻止提交）
   ↓
2. TypeScript 检查（错误，阻止提交）
   ↓
3. 单元测试（错误，阻止提交）← 新增
```

## 测试策略

### 测试层级
```
┌─────────────────────────────────────┐
│   E2E 测试 (Playwright)             │  ← CI/CD 运行
│   - 完整用户流程                    │
│   - 跨浏览器测试                    │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   集成测试                          │  ← CI/CD + 手动
│   - API 集成                        │
│   - 组件集成                        │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   单元测试 (Jest)                   │  ← Pre-commit 运行
│   - 组件测试                        │
│   - 工具函数                        │
│   - API 路由                        │
└─────────────────────────────────────┘
```

### Pre-commit 测试范围

**只运行快速测试**：
- ✅ 单元测试（目标：< 5 秒）
- ✅ 受修改文件影响的测试
- ❌ E2E 测试（太慢，留给 CI/CD）
- ❌ 完整测试套件（太慢）

## 配置说明

### 1. Jest 测试配置

**已安装的依赖**：
```json
{
  "devDependencies": {
    "jest": "29.7.0",
    "@testing-library/react": "14.1.2",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/jest": "^29.5.0"
  }
}
```

### 2. Pre-commit 测试命令

```bash
# 运行受修改影响的测试
npm run test -- --changedSince HEAD --passWithNoTests

# 运行特定测试文件
npm run test -- src/components/ui/Button.test.tsx

# 运行所有测试（不推荐在 pre-commit）
npm run test
```

### 3. 测试文件组织

```
apps/web/src/
├── components/
│   └── ui/
│       ├── Button.tsx
│       └── Button.test.tsx  ← 同名测试文件
├── app/
│   └── api/
│       └── tasks/
│           ├── route.ts
│           └── route.test.ts  ← 同名测试文件
```

## 使用指南

### 开发流程

```bash
# 1. 编写代码和测试
# 编辑 src/components/MyComponent.tsx
# 编辑 src/components/MyComponent.test.tsx

# 2. 运行测试（开发中）
npm run test -- --watch

# 3. 提交代码
git add .
git commit -m "feat: add MyComponent"

# Pre-commit hook 自动运行：
# - ESLint 检查
# - TypeScript 检查
# - 相关单元测试
```

### 测试失败处理

**如果测试失败**：
```
❌ 单元测试失败
请修复失败的测试后重新提交
提示：运行 'npm run test' 查看完整测试报告
```

**修复步骤**：
1. 运行 `npm run test` 查看详细错误
2. 修复代码或测试
3. 重新 `git add` 和 `git commit`

### 跳过测试（紧急情况）

⚠️ **不推荐**，但可以在紧急情况下使用：

```bash
# 跳过 pre-commit hook
git commit -m "fix: urgent fix" --no-verify

# 然后立即修复测试
npm run test
git commit -m "test: fix failing tests"
```

## 高级配置

### 智能测试选择

可以根据修改的文件类型运行不同的测试：

```bash
#!/bin/bash

# 获取修改的文件
CHANGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

# 检查是否修改了组件
if echo "$CHANGED_FILES" | grep -q "src/components/.*\.tsx$"; then
    echo "Running component tests..."
    npm run test -- --testPathPattern="components"
fi

# 检查是否修改了 API
if echo "$CHANGED_FILES" | grep -q "src/app/api/.*\.ts$"; then
    echo "Running API tests..."
    npm run test -- --testPathPattern="api"
fi

# 检查是否修改了测试文件
if echo "$CHANGED_FILES" | grep -q "\.test\."; then
    echo "Running modified test files..."
    for file in $CHANGED_FILES; do
        if [[ $file == *.test.* ]]; then
            npm run test -- "$file"
        fi
    done
fi
```

### 测试性能优化

**Jest 缓存**：
```javascript
// jest.config.js
module.exports = {
  cache: true,
  cacheDirectory: '.jest-cache',
}
```

**并行运行**：
```bash
# 使用所有 CPU 核心
npm run test -- --maxWorkers=4
```

## 故障排除

### 问题 1: 测试运行太慢

**解决方案**：
```bash
# 只运行相关测试
npm run test -- --changedSince HEAD

# 或使用 watch 模式（开发中）
npm run test -- --watch
```

### 问题 2: 测试环境配置错误

**检查 Jest 配置**：
```bash
# 确保安装了 jest.config.js
cat jest.config.js
```

**检查测试依赖**：
```bash
npm install --save-dev @testing-library/jest-dom @types/jest
```

### 问题 3: TypeScript 测试文件报错

**确保类型定义**：
```typescript
// src/components/ui/Button.test.tsx
import '@testing-library/jest-dom'  // Jest DOM 断言
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})
```

## 与 CI/CD 集成

### GitHub Actions 示例

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: npm run lint
      
      - name: Run TypeScript
        run: npx tsc --noEmit
      
      - name: Run Unit Tests
        run: npm run test -- --coverage
      
      - name: Run E2E Tests
        run: npm run test:e2e
```

## 最佳实践

1. **保持测试快速** - Pre-commit 测试应在 5 秒内完成
2. **测试隔离** - 每个测试应该独立运行
3. **测试命名清晰** - 说明测试目的
4. **使用测试覆盖工具** - 定期检查覆盖率
5. **自动化但不强制** - 允许紧急情况下跳过

## 下一步

1. ✅ Pre-commit 已配置运行单元测试
2. 📋 考虑添加测试覆盖率要求
3. 📋 考虑添加 E2E 测试到 CI/CD
4. 📋 考虑添加性能测试
