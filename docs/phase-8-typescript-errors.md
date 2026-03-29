# Phase-8 TypeScript 错误修复清单

**日期**: 2026-03-22
**分支**: feature/phase-8-scene-generator
**总计**: 约 44 个错误

---

## 错误分类

### 类别 A: ServerContextJSONValue 类型扩展 (7 个错误) 🔴 高优先级

**影响文件**:
- `src/app/auth/login/page.tsx` (12,11)
- `src/app/auth/register/page.tsx` (12,11)
- `src/app/game/page.tsx` (9,11), (9,17), (9,28)
- `src/components/game/PixiApp.tsx` (21,11), (21,17)

**错误信息**: `Property 'login' does not exist on type 'ServerContextJSONValue'`

**修复方案**:
1. 在 `src/types/global.d.ts` 中正确扩展类型
2. 或使用类型断言 `as any` 临时绕过

```diff
// src/types/global.d.ts
declare module 'next/types' {
  export interface ServerContextJSONValue {
    user?: { id?: string; username?: string } | null;
    login?: { email?: string | null } | null;
    isLoading?: boolean;
    logout?: () => void | Promise<void>;
  }
}
```

---

### 类别 B: Container.userData 属性不存在 (7 个错误) 🟡 中优先级

**影响文件**:
- `src/components/game/agents/AgentPanelPixi.ts` (342,15), (356,22), (362,22), (470,17), (471,61), (497,17), (498,50)

**错误信息**: `Property 'userData' does not exist on type 'Container<ContainerChild>'`

**修复方案**: 使用类型断言

```diff
- container.userData = data
+ ;(container as any).userData = data
```

---

### 类别 C: AgentSprite strokeThickness 属性 (1 个错误) 🟡 中优先级

**影响文件**:
- `src/components/game/agents/AgentSprite.ts` (211,7)

**错误信息**: `Object literal may only specify known properties, and 'strokeThickness' does not exist in type 'Partial<TextStyleOptions>'`

**修复方案**: PixiJS v8 使用 `strokeThickness` 作为独立方法

```diff
- style: { strokeThickness: 2 }
+ stroke: { width: 2 }
```

---

### 类别 D: getAccessoryColor 方法缺失 (4 个错误) 🟡 中优先级

**影响文件**:
- `src/components/game/agents/DesignerAgent.ts` (48,29), (53,29)
- `src/components/game/agents/MarketerAgent.ts` (50,29), (64,32)

**错误信息**: `Property 'getAccessoryColor' does not exist on type 'DesignerAgent'`

**修复方案**: 在对应类中添加方法

```typescript
protected getAccessoryColor(): number {
  return 0xE91E63; // 示例颜色
}
```

---

### 类别 E: PixiApp.tsx 多个错误 (8 个错误) 🟡 中优先级

**影响文件**:
- `src/components/game/PixiApp.tsx` (46,11), (50,9), (96-102)

**错误信息**:
- `Type '"webgl2"' is not assignable to type '"webgpu" | "webgl"'` (46,11)
- `'containerRef.current' is possibly 'null'` (50,9)
- `Expected 1 arguments, but got 2` (96-102)

**修复方案**:
```diff
- renderer: 'webgl2' as const
+ renderer: 'webgl' as const

- const container = containerRef.current;
+ const container = containerRef.current!; // 非空断言

- app.stage.addChild(sprite)
+ app.stage.addChild(sprite!) // 或检查 null
```

---

### 类别 F: ProgressDashboard unassigned 变量 (3 个错误) 🟢 低优先级

**影响文件**:
- `src/components/projects/ProgressDashboard.tsx` (243,12), (245,16), (245,33)

**错误信息**: `Cannot find name 'unassigned'`

**修复方案**: 定义变量或使用字符串字面量

```diff
- className={unassigned ? 'opacity-50' : ''}
+ className={isUnassigned ? 'opacity-50' : ''}
```

---

### 类别 G: AgentStateVisualizer AgentStatus 类型 (1 个错误) 🟢 低优先级

**影响文件**:
- `src/components/ui/AgentStateVisualizer.tsx` (328,13)

**错误信息**: `Type 'AgentStatus' is not assignable to type '"thinking" | "speaking" | "working" | "default"'`

**修复方案**: 添加类型转换或处理 'idle' 状态

```diff
- variant={agent.status}
+ variant={agent.status === 'idle' ? 'default' : agent.status}
```

---

### 类别 H: useAgent.ts setState 参数错误 (10 个错误) 🟢 低优先级

**影响文件**:
- `src/hooks/useAgent.ts` (101,7), (101,8), (101,19), (102,28), (102,35), (124,7), (124,8), (124,19), (125,28), (125,35)

**错误信息**: `Expected 1 arguments, but got 2` 和隐式 any 类型

**修复方案**: 修复 setState 回调签名

```diff
- setAgents((newAgents, prevAgents) => ..., (agent, id) => ...)
+ setAgents((prevAgents) => prevAgents.map((agent, id) => ...)
```

---

### 类别 I: useAgentScene.ts 类型错误 (2 个错误) 🟢 低优先级

**影响文件**:
- `src/hooks/useAgentScene.ts` (105,5), (224,11)

**错误信息**:
- `Property 'align' is missing in type 'HTMLElement'`
- `'appRef.current' is possibly 'null'`

**修复方案**: 类型断言或非空断言

---

### 类别 J: useAuth.ts AuthContext 导出问题 (1 个错误) 🟢 低优先级

**影响文件**:
- `src/hooks/useAuth.ts` (4,10)

**错误信息**: `Module '"../contexts/AuthContext"' declares 'AuthContext' locally, but it is not exported.`

**修复方案**: 在 AuthContext.tsx 中导出 AuthContext

```diff
- const AuthContext = createContext<...>
+ export const AuthContext = createContext<...>
```

---

### 类别 K: Player.ts objectLayer 私有属性 (1 个错误) 🟢 低优先级

**影响文件**:
- `src/components/game/entities/Player.ts` (73,16)

**错误信息**: `Property 'objectLayer' is private and only accessible within class 'CampusScene'`

**修复方案**: 添加 getter 方法或改为 protected

---

## 修复顺序

1. **类别 A** - ServerContextJSONValue (7 个错误) - 影响 auth 和 game 页面
2. **类别 B** - Container.userData (7 个错误) - 使用类型断言快速修复
3. **类别 D** - getAccessoryColor (4 个错误) - 添加缺失方法
4. **类别 E** - PixiApp.tsx (8 个错误) - 多个问题需要逐一修复
5. **类别 F** - ProgressDashboard (3 个错误) - 简单变量修复
6. **类别 C** - strokeThickness (1 个错误) - API 变更
7. **类别 G** - AgentStateVisualizer (1 个错误) - 类型转换
8. **类别 H** - useAgent.ts (10 个错误) - setState 签名
9. **类别 I** - useAgentScene.ts (2 个错误) - 类型断言
10. **类别 J** - useAuth.ts (1 个错误) - 导出 AuthContext
11. **类别 K** - Player.ts (1 个错误) - 访问权限

---

## 修复后验证

```bash
cd apps/web
npx tsc --noEmit  # 检查错误是否解决
npm run lint      # 确保 ESLint 通过
git add -A && git commit -m "fix: resolve TypeScript errors"
git push origin feature/phase-8-scene-generator
```
