# Test-Driven Development Skill for Claude Code

## 目标
在提交代码前自动运行相关测试，确保代码质量。

## 工作流程

### 1. 检测修改的文件
```bash
# 获取自上次提交以来修改的文件
git diff --name-only HEAD
```

### 2. 识别受影响的测试
- 如果修改了 `src/components/**/*.tsx` → 运行对应的 `.test.tsx`
- 如果修改了 `src/app/api/**/*.ts` → 运行对应的 `.test.ts`
- 如果修改了公共工具函数 → 运行所有相关测试

### 3. 运行测试
```bash
# 运行 Jest 单元测试
npm run test -- --changedSince HEAD

# 或者运行特定测试文件
npm run test -- src/components/ui/Button.test.tsx
```

### 4. 测试失败处理
- 显示详细的错误信息
- 提供修复建议
- 阻止提交直到测试通过

## 命令示例

### 创建测试驱动的开发流程
```
调用 superpowers:test-driven-development
Prompt: "为当前修改的文件运行 TDD 流程"
```

### 运行特定测试
```bash
npm run test -- --testPathPattern=Button
```

### 运行所有测试
```bash
npm run test
```

## 测试覆盖范围

### 单元测试（Jest）
- ✅ React 组件测试
- ✅ API 路由测试
- ✅ 工具函数测试
- ✅ 业务逻辑测试

### 集成测试（Playwright）
- ✅ 用户认证流程
- ✅ 项目创建流程
- ✅ 智能体交互流程

### E2E 测试
- ✅ 完整用户流程
- ✅ 跨浏览器测试

## 最佳实践

1. **测试应该快速** - 单个测试 < 100ms
2. **测试应该独立** - 不依赖外部状态
3. **测试应该可重复** - 每次运行结果一致
4. **测试应该有描述性名称** - 清楚说明测试目的

## 配置说明

### Jest 配置
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}
```

### Playwright 配置
```javascript
// playwright.config.ts
export default {
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
  },
}
```

## 故障排除

### 测试运行缓慢
- 使用 `--changedSince` 只运行相关测试
- 启用 Jest 缓存
- 并行运行测试

### 测试失败但代码正确
- 检查测试数据是否正确
- 检查 mock 是否准确
- 更新测试用例

### TypeScript 测试错误
- 确保类型定义完整
- 使用 `@types/jest` 和 `@testing-library/jest-dom`
