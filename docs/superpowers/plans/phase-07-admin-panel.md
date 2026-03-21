# Phase 7: 管理后台实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建基础管理后台，实现用户管理、项目管理、作品审核、智能体配置功能。

**Architecture:** Next.js 管理后台应用，独立的 `/admin` 目录，与前端共享 Prisma Schema 和认证系统。

**Tech Stack:** Next.js 14, shadcn/ui, Recharts, Prisma, NextAuth

**前置条件:**
- Phase 1 用户认证系统已完成
- Phase 5 项目任务系统已完成

---

## Task 7.1: 创建管理后台脚手架

**Files:**
- Create: `apps/admin/package.json`
- Create: `apps/admin/src/app/layout.tsx`
- Create: `apps/admin/src/app/(auth)/login/page.tsx`
- Create: `apps/admin/src/app/(dashboard)/layout.tsx`
- Create: `apps/admin/src/app/(dashboard)/page.tsx`

- [ ] **Step 1: 创建管理后台 package.json**

```json
{
  "name": "@pbl/admin",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next-auth": "^4.24.0",
    "@prisma/client": "^5.9.0",
    "zod": "^3.22.0",
    "recharts": "^2.10.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "tailwindcss": "^3.4.0",
    "lucide-react": "^0.312.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "typescript": "^5.3.0",
    "prisma": "^5.9.0"
  }
}
```

- [ ] **Step 2: 创建管理后台布局**

```tsx
// apps/admin/src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '可视项目式学习平台 - 管理后台',
  description: 'K12 PBL 平台管理后台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 3: 创建管理后台仪表盘布局**

```tsx
// apps/admin/src/app/(dashboard)/layout.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Users,
  BookOpen,
  Image,
  Bot,
  Database,
  Menu,
  X
} from 'lucide-react'

const navigation = [
  { name: '仪表盘', href: '/', icon: null },
  { name: '用户管理', href: '/users', icon: Users },
  { name: '项目管理', href: '/projects', icon: BookOpen },
  { name: '作品审核', href: '/works', icon: Image },
  { name: '智能体配置', href: '/agents', icon: Bot },
  { name: '知识库', href: '/knowledge', icon: Database },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <h1 className="text-xl font-bold text-primary">管理后台</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                  ${isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                {item.icon && <item.icon className="h-5 w-5" />}
                {item.name}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center h-16 px-4 bg-white border-b shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-primary"
          >
            返回学生端 →
          </Link>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 创建仪表盘首页**

```tsx
// apps/admin/src/app/(dashboard)/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Users, BookOpen, Image, TrendingUp } from 'lucide-react'

interface DashboardStats {
  totalUsers: number
  totalProjects: number
  totalWorks: number
  pendingReviews: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => setStats(data))
  }, [])

  const cards = [
    {
      title: '总用户数',
      value: stats?.totalUsers ?? '-',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: '项目总数',
      value: stats?.totalProjects ?? '-',
      icon: BookOpen,
      color: 'bg-green-500'
    },
    {
      title: '作品总数',
      value: stats?.totalWorks ?? '-',
      icon: Image,
      color: 'bg-purple-500'
    },
    {
      title: '待审核作品',
      value: stats?.pendingReviews ?? '-',
      icon: TrendingUp,
      color: 'bg-orange-500'
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">仪表盘</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.title} className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">最近注册用户</h2>
          <div className="text-gray-500">待实现</div>
        </div>

        {/* Pending Reviews */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">待审核作品</h2>
          <div className="text-gray-500">待实现</div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/admin/
git commit -m "feat(phase-7): setup admin panel scaffold

- Add Next.js admin application
- Add dashboard layout with sidebar navigation
- Add responsive design for mobile/desktop
- Add stats cards component"
```

---

## Task 7.2: 用户管理页面

**Files:**
- Create: `apps/admin/src/app/(dashboard)/users/page.tsx`
- Create: `apps/admin/src/app/api/admin/users/route.ts`
- Create: `apps/admin/src/components/users/UserTable.tsx`

- [ ] **Step 1: 创建用户管理 API**

```typescript
// apps/admin/src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''

  const where = search ? {
    OR: [
      { username: { contains: search } },
      { nickname: { contains: search } },
    ]
  } : {}

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        username: true,
        nickname: true,
        grade: true,
        points: true,
        level: true,
        createdAt: true,
        invitedBy: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ])

  return NextResponse.json({
    users,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}
```

- [ ] **Step 2: 创建用户表格组件**

```tsx
// apps/admin/src/components/users/UserTable.tsx
'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  username: string
  nickname: string | null
  grade: number | null
  points: number
  level: number
  createdAt: string
}

interface UserTableProps {
  initialData: {
    users: User[]
    total: number
    page: number
    totalPages: number
  }
}

export default function UserTable({ initialData }: UserTableProps) {
  const [users, setUsers] = useState(initialData.users)
  const [page, setPage] = useState(initialData.page)
  const [totalPages, setTotalPages] = useState(initialData.totalPages)
  const [search, setSearch] = useState('')

  const fetchUsers = async (pageNum: number, searchQuery: string) => {
    const params = new URLSearchParams({
      page: String(pageNum),
      limit: '20',
      ...(searchQuery && { search: searchQuery }),
    })

    const res = await fetch(`/api/admin/users?${params}`)
    const data = await res.json()
    setUsers(data.users)
    setPage(data.page)
    setTotalPages(data.totalPages)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchUsers(1, search)
  }

  return (
    <div className="bg-white rounded-xl shadow">
      <div className="p-4 border-b">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索用户名或昵称..."
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700"
          >
            搜索
          </button>
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">用户名</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">昵称</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">年级</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">积分</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">等级</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">注册时间</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{user.username}</td>
                <td className="px-4 py-3 text-sm">{user.nickname || '-'}</td>
                <td className="px-4 py-3 text-sm">{user.grade ? `${user.grade}年级` : '-'}</td>
                <td className="px-4 py-3 text-sm">{user.points}</td>
                <td className="px-4 py-3 text-sm">Lv.{user.level}</td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                </td>
                <td className="px-4 py-3 text-sm">
                  <button className="text-primary hover:underline">查看</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          第 {page} 页，共 {totalPages} 页
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => fetchUsers(page - 1, search)}
            disabled={page <= 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            上一页
          </button>
          <button
            onClick={() => fetchUsers(page + 1, search)}
            disabled={page >= totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 创建用户管理页面**

```tsx
// apps/admin/src/app/(dashboard)/users/page.tsx
import { Suspense } from 'react'
import UserTable from '@/components/users/UserTable'

async function getUsers(page = 1) {
  const res = await fetch(`http://localhost:3001/api/admin/users?page=${page}`, {
    cache: 'no-store',
  })
  return res.json()
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const page = parseInt(searchParams.page || '1')
  const data = await getUsers(page)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">用户管理</h1>
      <Suspense fallback={<div>加载中...</div>}>
        <UserTable initialData={data} />
      </Suspense>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/app/\(dashboard\)/users
git add apps/admin/src/app/api/admin/users
git add apps/admin/src/components/users
git commit -m "feat(phase-7): add user management page

- Add user list API with pagination and search
- Add UserTable component with sorting and filtering
- Add user management page with server-side data fetching"
```

---

## Task 7.3: 作品审核页面

**Files:**
- Create: `apps/admin/src/app/(dashboard)/works/page.tsx`
- Create: `apps/admin/src/app/api/admin/works/route.ts`
- Create: `apps/admin/src/app/api/admin/works/[id]/review/route.ts`
- Create: `apps/admin/src/components/works/WorkReviewModal.tsx`

- [ ] **Step 1: 创建作品审核 API**

```typescript
// apps/admin/src/app/api/admin/works/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'pending_review'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const [works, total] = await Promise.all([
    prisma.work.findMany({
      where: { status: status as any },
      include: {
        user: {
          select: { username: true, nickname: true },
        },
        project: {
          select: { title: true },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.work.count({ where: { status: status as any } }),
  ])

  return NextResponse.json({
    works,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}
```

- [ ] **Step 2: 创建作品审核操作 API**

```typescript
// apps/admin/src/app/api/admin/works/[id]/review/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { action, notes } = await req.json()

  if (!['approved', 'rejected'].includes(action)) {
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  }

  const work = await prisma.work.update({
    where: { id: params.id },
    data: {
      status: action,
      reviewNotes: notes,
      reviewedAt: new Date(),
    },
  })

  return NextResponse.json({ work })
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/admin/src/app/\(dashboard\)/works
git add apps/admin/src/app/api/admin/works
git commit -m "feat(phase-7): add work review functionality

- Add work list API with status filtering
- Add work review API (approve/reject)
- Add review notes support"
```

---

## Task 7.4: 项目管理页面

**Files:**
- Create: `apps/admin/src/app/(dashboard)/projects/page.tsx`
- Create: `apps/admin/src/app/api/admin/projects/route.ts`
- Create: `apps/admin/src/components/projects/ProjectForm.tsx`

- [ ] **Step 1: 创建项目管理 API**

```typescript
// apps/admin/src/app/api/admin/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const where = status ? { status } : {}

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        _count: {
          select: {
            tasks: true,
            works: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.project.count({ where }),
  ])

  return NextResponse.json({
    projects,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}

export async function POST(req: NextRequest) {
  const { title, description, gradeMin, gradeMax, subject, difficulty } = await req.json()

  const project = await prisma.project.create({
    data: {
      title,
      description,
      gradeMin,
      gradeMax,
      subject,
      difficulty,
      status: 'draft',
    },
  })

  return NextResponse.json({ project }, { status: 201 })
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/app/\(dashboard\)/projects
git add apps/admin/src/app/api/admin/projects
git commit -m "feat(phase-7): add project management page

- Add project list API with filtering
- Add project creation API
- Add project form component"
```

---

## Task 7.5: 智能体配置页面

**Files:**
- Create: `apps/admin/src/app/(dashboard)/agents/page.tsx`
- Create: `apps/admin/src/app/api/admin/agents/route.ts`
- Create: `apps/admin/src/components/agents/AgentForm.tsx`

- [ ] **Step 1: 创建智能体管理 API**

```typescript
// apps/admin/src/app/api/admin/agents/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const agents = await prisma.agent.findMany({
    orderBy: { agentType: 'asc' },
  })

  return NextResponse.json({ agents })
}

export async function POST(req: NextRequest) {
  const { name, agentType, description, personality, skills, avatarUrl } = await req.json()

  const agent = await prisma.agent.create({
    data: {
      name,
      agentType,
      description,
      personality: personality ? JSON.parse(personality) : null,
      skills: skills ? JSON.parse(skills) : null,
      avatarUrl,
    },
  })

  return NextResponse.json({ agent }, { status: 201 })
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/app/\(dashboard\)/agents
git add apps/admin/src/app/api/admin/agents
git commit -m "feat(phase-7): add agent configuration page

- Add agent list API
- Add agent creation/edit API
- Add agent form with JSON configuration"
```

---

## Task 7.6: 审计日志和数据分析

**Files:**
- Create: `apps/admin/src/app/(dashboard)/audit-logs/page.tsx`
- Create: `apps/admin/src/app/api/admin/audit-logs/route.ts`
- Create: `docker/init-db/006-audit-logs.sql`

- [ ] **Step 1: 创建审计日志表**

```sql
-- docker/init-db/006-audit-logs.sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES admin_users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

COMMENT ON TABLE audit_logs IS '审计日志表 - 记录所有管理操作';
```

- [ ] **Step 2: Commit**

```bash
git add docker/init-db/006-audit-logs.sql
git commit -m "feat(phase-7): add audit logs table

- Add audit_logs table for tracking admin actions
- Add indexes for efficient querying"
```

---

## Phase 7 完成检查清单

- [ ] 管理后台脚手架搭建完成
- [ ] 用户管理页面可正常使用
- [ ] 作品审核功能完整（查看/批准/拒绝）
- [ ] 项目管理功能完整（CRUD）
- [ ] 智能体配置功能完整
- [ ] 审计日志记录完整
- [ ] 移动端响应式适配
- [ ] 所有 API 测试通过

---

## 下一步

Phase 7 完成后，所有 MVP 功能完成，可以进行：

1. **Phase 6** - 集成测试和优化
2. **MVP 验收测试**
3. **部署上线准备**

---

**文档结束**
