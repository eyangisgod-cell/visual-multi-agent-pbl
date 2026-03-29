# Pre-commit Hook 配置说明

## 问题解答

### Q1: Pre-commit Hook 在哪里实现？

**文件位置**: `apps/web/.husky/pre-commit`

**触发机制**:
```bash
# 当你执行 git commit 时自动触发
git commit -m "fix: ..."

# Git → Husky → 执行 .husky/pre-commit 脚本
```

**Husky 工作原理**:
1. Husky 是一个 Git hooks 管理工具
2. 它在 `.husky/` 目录下创建 Git hook 脚本
3. 当你运行 `git commit` 时，Git 会自动执行 `pre-commit` 钩子
4. 如果钩子返回非零退出码，提交会被阻止

---

### Q2: ESLint 检查哪些内容？失败是否影响提交？

**ESLint 检查内容**:

基于 `next/core-web-vitals` 配置，检查：

| 类别 | 检查项 | 示例 |
|------|--------|------|
| **代码风格** | 缩进、引号、分号 | `console.log("test")` vs `console.log('test')` |
| **未使用代码** | 未使用的变量、导入 | `import { unused } from 'module'` |
| **React 规则** | Hook 使用规则、key 属性 | `<div key={id}>` |
| **Next.js 规则** | 图片使用、链接使用 | `<Image>` vs `<img>` |
| **潜在错误** | 危险的 eval、隐式全局 | `eval(code)`, `x = 1` |

**失败不影响提交的原因**:

```bash
npm run lint --quiet || {
    echo "⚠️  ESLint 检查未通过"
    echo "建议运行：npm run lint:fix"
    # 不阻止提交（没有 exit 1）
}
```

**为什么这样设计**:
- ✅ ESLint 问题通常是**风格问题**，不影响功能
- ✅ 可以后续修复，不是阻塞性问题
- ✅ 避免因为格式化问题阻止紧急修复

**如果你想让 ESLint 阻止提交**:
```bash
npm run lint || {
    echo "❌ ESLint 失败，阻止提交"
    exit 1
}
```

---

### Q3: TypeScript 检查哪些内容？失败影响提交吗？

**TypeScript 检查内容**:

| 类别 | 检查项 | 示例 |
|------|--------|------|
| **类型匹配** | 变量类型、函数参数 | `function add(a: number, b: number)` |
| **类型定义** | 接口、类型别名 | `interface User { id: number }` |
| **返回值类型** | 函数返回类型 | `function getUser(): Promise<User>` |
| **属性访问** | 对象属性是否存在 | `user.name` (如果 name 未定义则报错) |
| **泛型约束** | 泛型类型参数 | `function identity<T>(arg: T): T` |

**失败会阻止提交**:

```bash
npx tsc --noEmit || {
    echo "❌ TypeScript 类型错误"
    echo "请修复类型错误后重新提交"
    exit 1  # ← 阻止提交
}
```

**为什么这样设计**:
- ❌ TypeScript 错误是**编译错误**
- ❌ 会导致运行时崩溃
- ❌ 必须修复才能保证代码质量

---

### Q4: 为什么不能自动修复 TypeScript 错误？

**TypeScript 错误的性质**:

**可以自动修复的**（简单情况）:
```typescript
// ❌ 错误：缺少类型
const user = { name: "John" }

// ✅ 自动修复：添加类型推断
const user: { name: string } = { name: "John" }
```

**不能自动修复的**（需要人工判断）:
```typescript
// ❌ 错误：类型不匹配
function calculateTotal(price: number, quantity: string) {
    return price * quantity  // quantity 应该是 number 还是 string?
}

// 可能的修复：
// 方案 1: 修改参数类型
function calculateTotal(price: number, quantity: number) {
    return price * quantity
}

// 方案 2: 类型转换（如果输入确实是 string）
function calculateTotal(price: number, quantity: string) {
    return price * parseInt(quantity)
}

// 方案 3: 联合类型
function calculateTotal(price: number, quantity: number | string) {
    const qty = typeof quantity === 'string' ? parseInt(quantity) : quantity
    return price * qty
}
```

**Claude Code 的限制**:

| 能力 | 说明 |
|------|------|
| ✅ 检测错误 | 可以识别 TypeScript 错误 |
| ✅ 提供建议 | 可以给出多个修复方案 |
| ✅ 生成代码 | 可以在对话中生成修复代码 |
| ❌ 自动决策 | 无法理解业务逻辑来选择正确的修复方案 |
| ❌ 保证正确 | 自动修复可能引入新 bug |

**最佳实践**:
1. 在开发过程中使用 AI 辅助修复
2. Pre-commit 只负责检查和阻止
3. 人工审查修复方案，确保正确性

---

### Q5: 为什么不运行单元测试？测试不通过应该也不能提交吧？

**原来的设计考虑**:

| 因素 | 说明 |
|------|------|
| **性能** | 完整测试套件可能需要几分钟 |
| **体验** | Pre-commit 应该快速（< 5 秒） |
| **策略** | 测试应该在开发阶段手动运行 |

**但你说得对：单元测试失败应该阻止提交！**

**已实现的改进**:

现在 pre-commit 包含**智能测试选择**：

```bash
# 3. 运行智能测试（TDD 流程）
echo "Running smart test selection..."
bash "$PROJECT_ROOT/scripts/run-tdd-tests.sh"
```

**智能测试脚本功能**:
1. ✅ 检测修改的文件类型
2. ✅ 只运行相关的测试（组件/API/工具）
3. ✅ 保持快速（通常 < 5 秒）
4. ✅ 失败时阻止提交

---

## 新的 TDD 流程

### 工作流程

```
开发者修改代码
    ↓
git add .
    ↓
git commit -m "feat: ..."
    ↓
Pre-commit Hook 执行:
┌────────────────────────────────┐
│ 1. ESLint 检查                 │ ← 警告，不阻止
│ 2. TypeScript 检查             │ ← 错误，阻止
│ 3. 智能测试选择                │ ← 失败，阻止 ← 新增
│    - 组件修改 → 组件测试       │
│    - API 修改 → API 测试       │
│    - 工具修改 → 工具测试       │
└────────────────────────────────┘
    ↓
提交成功 / 失败
```

### 使用示例

**场景 1: 修改组件**
```bash
# 修改了 src/components/ui/Button.tsx
git add .
git commit -m "feat: update Button component"

# 自动运行：
# - ESLint 检查
# - TypeScript 检查
# - 组件测试（components 相关）
```

**场景 2: 修改 API**
```bash
# 修改了 src/app/api/tasks/route.ts
git add .
git commit -m "feat: add task API"

# 自动运行：
# - ESLint 检查
# - TypeScript 检查
# - API 测试（api 相关）
```

**场景 3: 修改测试文件**
```bash
# 修改了 src/components/ui/Button.test.tsx
git add .
git commit -m "test: update Button tests"

# 自动运行：
# - ESLint 检查
# - TypeScript 检查
# - 直接运行 Button.test.tsx
```

---

## 文件清单

### 已创建/修改的文件

| 文件 | 说明 |
|------|------|
| `apps/web/.husky/pre-commit` | ✅ 已更新，包含智能测试 |
| `scripts/run-tdd-tests.sh` | ✅ 新建，智能测试脚本 |
| `.claude/skills/tdd/SKILL.md` | ✅ 新建，TDD skill 文档 |
| `docs/testing/pre-commit-testing.md` | ✅ 新建，完整测试配置文档 |

### 使用方法

**运行 TDD 测试脚本**:
```bash
# 手动运行
bash scripts/run-tdd-tests.sh

# 或在提交时自动运行
git commit -m "feat: add new feature"
```

**使用 Claude Code TDD Skill**:
```
调用 superpowers:test-driven-development
Prompt: "为当前修改的文件运行 TDD 流程"
```

---

## 配置选项

### 自定义测试行为

**如果想跳过测试**（紧急情况）:
```bash
git commit --no-verify -m "fix: urgent fix"
```

⚠️ **注意**: 只应在紧急情况下使用，之后应立即修复测试

**如果想让 ESLint 也阻止提交**:
```bash
# 修改 apps/web/.husky/pre-commit
npm run lint || {
    echo "❌ ESLint 失败"
    exit 1  # 添加这行
}
```

**如果想运行完整测试套件**:
```bash
# 修改 scripts/run-tdd-tests.sh
npm run test  # 运行所有测试
```

---

## 故障排除

### 问题 1: 测试运行太慢

**解决方案**:
```bash
# 检查是否运行了所有测试而不是相关测试
bash scripts/run-tdd-tests.sh --verbose

# 确保 Jest 缓存启用
npm run test -- --cache
```

### 问题 2: 测试失败但代码正确

**可能原因**:
- 测试数据过时
- Mock 配置错误
- 测试环境问题

**解决方案**:
```bash
# 查看详细错误
npm run test

# 更新测试快照
npm run test -- -u

# 清除缓存
npm run test -- --clearCache
```

### 问题 3: Pre-commit Hook 不执行

**检查 Husky 安装**:
```bash
# 验证 husky 是否正确安装
ls -la .husky/pre-commit

# 重新安装 husky
npm install husky --save-dev
npx husky install
```

---

## 最佳实践

1. **保持测试快速** - 单个测试 < 100ms，总测试 < 5 秒
2. **测试隔离** - 每个测试独立运行
3. **测试命名清晰** - 说明测试目的
4. **使用测试覆盖工具** - 定期检查覆盖率
5. **自动化但不强制** - 允许紧急情况下跳过

---

## 下一步

- [x] Pre-commit 配置智能测试选择
- [x] 创建 TDD skill 文档
- [x] 创建测试配置文档
- [ ] 添加测试覆盖率要求（> 80%）
- [ ] 配置 CI/CD 运行 E2E 测试
- [ ] 添加性能测试
