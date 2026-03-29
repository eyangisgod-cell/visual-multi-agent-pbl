---
name: suggested_commands
description: Phase 9 开发命令指南
type: reference
---

# 建议的命令

## 数据库操作
```bash
npx prisma generate          # 生成 Prisma Client
npx prisma db push           # 推送 Schema 到数据库
npx prisma migrate dev       # 开发环境迁移
```

## 测试
```bash
npm test                     # 运行 Jest 测试
npm test -- path/to/test.ts  # 运行特定测试
npm run test:e2e             # 运行 Playwright E2E
```

## 代码检查
```bash
npm run lint                 # ESLint 检查
npm run lint:fix             # ESLint 自动修复
npx tsc --noEmit             # TypeScript 类型检查
npx prettier --write .       # Prettier 格式化
```

## 开发服务器
```bash
npm run dev                  # 启动 Next.js 开发服务器
```

## 构建
```bash
npm run build                # 生产构建
```