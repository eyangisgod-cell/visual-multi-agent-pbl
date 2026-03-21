# Visual PBL Platform MVP Implementation Plan - Supplement

**补充文档**: 完整的 Phase 1-6 详细任务分解

**主计划文档**: `2026-03-21-visual-pbl-mvp-plan.md`

---

## Phase 1: 用户认证系统（完整任务）

### Task 1.1: 实现用户注册 API

**Files:**
- Create: `frontend/src/app/api/auth/register/route.ts`
- Create: `frontend/src/app/api/auth/login/route.ts`
- Create: `frontend/src/app/api/auth/logout/route.ts`
- Test: `frontend/src/app/api/auth/register/route.test.ts`

- [ ] **Step 1: 编写注册 API 测试**

```typescript
// src/app/api/auth/register/route.test.ts
import { POST } from './route'
import { prisma } from '@/lib/prisma'

describe('Register API', () => {
  it('should create user with username and password', async () => {
    const req = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: 'testuser',
        password: 'password123',
        nickname: '测试用户',
      }),
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.user).toHaveProperty('id')
    expect(data.user.username).toBe('testuser')
  })

  it('should reject duplicate username', async () => {
    // First create user
    await prisma.user.create({
      data: { username: 'existing', passwordHash: 'hash' },
    })

    const req = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: 'existing',
        password: 'password123',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(409)
  })
})
```

- [ ] **Step 2: 运行测试验证失败**

```bash
cd frontend
npm test -- api/auth/register/route.test.ts
```

Expected: FAIL - Module not found (API not implemented yet)

- [ ] **Step 3: 实现注册 API**

```typescript
// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  nickname: z.string().max(50).optional(),
  invitationCode: z.string().max(10).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username, password, nickname, invitationCode } = registerSchema.parse(body)

    // Check if user exists
    const existing = await prisma.user.findFirst({
      where: { username },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      )
    }

    // Verify invitation code if provided
    let invitedBy: string | null = null
    if (invitationCode) {
      const inviter = await prisma.user.findFirst({
        where: { invitationCode },
      })
      if (!inviter) {
        return NextResponse.json(
          { error: 'Invalid invitation code' },
          { status: 400 }
        )
      }
      invitedBy = inviter.id
    }

    // Generate unique invitation code for new user
    const newInvitationCode = `INV${Date.now()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`

    // Create user
    const passwordHash = await hash(password, 10)
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        nickname,
        invitationCode: newInvitationCode,
        invitedBy,
        points: invitedBy ? 100 : 0, // Bonus for inviter
      },
      select: {
        id: true,
        username: true,
        nickname: true,
        invitationCode: true,
        points: true,
        level: true,
      },
    })

    // Update inviter's points
    if (invitedBy) {
      await prisma.user.update({
        where: { id: invitedBy },
        data: { points: { increment: 50 } },
      })
    }

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 4: 运行测试验证通过**

```bash
cd frontend
npm test -- api/auth/register/route.test.ts
```

Expected: PASS - All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/app/api/auth/register src/app/api/auth/register.test.ts
git commit -m "feat: implement user registration API with Zod validation"
```

---

### Task 1.2: 实现登录 API 和会话管理

**Files:**
- Create: `frontend/src/app/api/auth/login/route.ts`
- Create: `frontend/src/lib/session.ts`
- Create: `backend/ai-service/app/api/auth.py`

- [ ] **Step 1: 实现登录 API**

```typescript
// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { z } from 'zod'

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username, password } = loginSchema.parse(body)

    // Find user
    const user = await prisma.user.findFirst({
      where: { username },
    })

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const valid = await compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate session token
    const token = sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Store session in database
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    })

    // Return user data without sensitive info
    const { passwordHash, ...userWithoutPassword } = user
    return NextResponse.json({
      user: userWithoutPassword,
      token,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: 实现登出 API**

```typescript
// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (token) {
      await prisma.session.deleteMany({
        where: { token },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/auth/login src/app/api/auth/logout src/lib/session.ts
git commit -m "feat: implement login/logout with JWT sessions"
```

---

### Task 1.3: 创建登录注册 UI 页面

**Files:**
- Create: `frontend/src/app/auth/login/page.tsx`
- Create: `frontend/src/app/auth/register/page.tsx`
- Create: `frontend/src/components/ui/Form.tsx`
- Create: `frontend/src/components/ui/Input.tsx`
- Create: `frontend/src/components/ui/Button.tsx`

- [ ] **Step 1: 创建基础 UI 组件**

```tsx
// src/components/ui/Input.tsx
import { forwardRef } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          className={cn(
            'w-full px-3 py-2 border rounded-lg',
            'focus:outline-none focus:ring-2 focus:ring-primary',
            error ? 'border-red-500' : 'border-gray-300',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
```

```tsx
// src/components/ui/Button.tsx
import { forwardRef } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', isLoading, children, ...props }, ref) => {
    return (
      <button
        className={cn(
          'px-4 py-2 rounded-lg font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          variant === 'primary' && 'bg-primary text-white hover:bg-indigo-700',
          variant === 'secondary' && 'bg-secondary text-white hover:bg-violet-700',
          variant === 'outline' && 'border border-gray-300 hover:bg-gray-50',
          isLoading && 'opacity-50 cursor-not-allowed',
          className
        )}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            加载中...
          </span>
        ) : children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
```

- [ ] **Step 2: 创建登录页面**

```tsx
// src/app/auth/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Store token in localStorage
      localStorage.setItem('token', data.token)

      // Redirect to home
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
          登录
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="用户名"
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
          />

          <Input
            label="密码"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" isLoading={isLoading}>
            登录
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          还没有账号？{' '}
          <Link href="/auth/register" className="text-primary hover:underline">
            立即注册
          </Link>
        </div>

        <div className="mt-4 text-center text-sm text-gray-600">
          <Link href="/" className="text-gray-500 hover:underline">
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 创建注册页面**

```tsx
// src/app/auth/register/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    invitationCode: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          nickname: formData.nickname,
          invitationCode: formData.invitationCode,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Auto login after registration
      router.push('/auth/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
          注册
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="用户名"
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
          />

          <Input
            label="昵称（可选）"
            type="text"
            value={formData.nickname}
            onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
          />

          <Input
            label="密码"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />

          <Input
            label="确认密码"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
          />

          <Input
            label="邀请码（可选）"
            type="text"
            value={formData.invitationCode}
            onChange={(e) => setFormData({ ...formData, invitationCode: e.target.value })}
            placeholder="有邀请码吗？"
          />

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" isLoading={isLoading}>
            注册
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          已有账号？{' '}
          <Link href="/auth/login" className="text-primary hover:underline">
            立即登录
          </Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/auth src/components/ui
git commit -m "feat: create login and register UI pages"
```

---

## Phase 2: PixiJS 游戏场景（完整任务）

### Task 2.1: PixiJS 应用初始化

**Files:**
- Create: `frontend/src/components/pixi/GameCanvas.tsx`
- Create: `frontend/src/components/pixi/GameApp.ts`
- Create: `frontend/src/lib/pixi/types.ts`

- [ ] **Step 1: 定义类型**

```typescript
// src/lib/pixi/types.ts
import type { Application, Container, Sprite } from 'pixi.js'

export interface GameConfig {
  width: number
  height: number
  backgroundColor: number
  pixelRatio: number
}

export interface GamePosition {
  x: number
  y: number
}

export interface AgentSpriteData {
  id: string
  type: string
  position: GamePosition
  targetPosition?: GamePosition
  isMoving: boolean
  expression: 'normal' | 'happy' | 'thinking' | 'speaking'
  speechBubble?: string
}

export interface GameState {
  agents: AgentSpriteData[]
  selectedAgentId?: string
  isPaused: boolean
}
```

- [ ] **Step 2: 创建游戏应用类**

```typescript
// src/components/pixi/GameApp.ts
import { Application, Assets, Sprite, Container } from 'pixi.js'
import type { GameConfig, GamePosition, AgentSpriteData } from '@/lib/pixi/types'

export class GameApp {
  public app: Application
  public config: GameConfig
  public rootContainer: Container
  public agentLayer: Container
  public uiLayer: Container

  constructor(config: Partial<GameConfig> = {}) {
    this.config = {
      width: 800,
      height: 600,
      backgroundColor: 0x87CEEB,
      pixelRatio: window.devicePixelRatio,
      ...config,
    }
  }

  async init(canvas: HTMLCanvasElement) {
    this.app = new Application()

    await this.app.init({
      canvas,
      width: this.config.width,
      height: this.config.height,
      backgroundColor: this.config.backgroundColor,
      resolution: this.config.pixelRatio,
      autoDensity: true,
    })

    // Create layer containers
    this.rootContainer = new Container()
    this.agentLayer = new Container()
    this.uiLayer = new Container()

    this.rootContainer.addChild(this.agentLayer)
    this.rootContainer.addChild(this.uiLayer)
    this.app.stage.addChild(this.rootContainer)

    // Handle resize
    window.addEventListener('resize', () => this.onResize())
    this.onResize()

    return this.app
  }

  private onResize() {
    const parent = this.app.canvas.parentElement
    if (!parent) return

    const { clientWidth, clientHeight } = parent
    this.app.renderer.resize(clientWidth, clientHeight)
  }

  async loadAgentSprites() {
    // Load agent sprite sheets
    await Assets.load([
      '/sprites/agent-mentor.png',
      '/sprites/agent-designer.png',
      '/sprites/agent-analyst.png',
      '/sprites/agent-marketer.png',
      '/sprites/agent-assistant.png',
    ])
  }

  createAgentSprite(agentData: AgentSpriteData): Sprite {
    const sprite = new Sprite(Assets.get(`/sprites/agent-${agentData.type}.png`))
    sprite.anchor.set(0.5)
    sprite.x = agentData.position.x
    sprite.y = agentData.position.y
    sprite.scale.set(0.5) // Scale down for pixel art style
    return sprite
  }
}
```

- [ ] **Step 3: 创建 React 组件**

```tsx
// src/components/pixi/GameCanvas.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { GameApp } from './GameApp'
import type { GameState } from '@/lib/pixi/types'

interface GameCanvasProps {
  onGameReady?: (game: GameApp) => void
  onGameStateChange?: (state: GameState) => void
}

export default function GameCanvas({ onGameReady, onGameStateChange }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<GameApp | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    async function init() {
      if (!canvasRef.current) return

      const game = new GameApp({
        pixelRatio: Math.min(window.devicePixelRatio, 2), // Cap at 2x for performance
      })

      await game.init(canvasRef.current)
      await game.loadAgentSprites()

      gameRef.current = game
      setIsReady(true)

      onGameReady?.(game)
    }

    init()

    return () => {
      gameRef.current?.app.destroy()
    }
  }, [])

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none"
        style={{ imageRendering: 'pixelated' }}
      />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-gray-600">加载游戏场景...</p>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/pixi src/lib/pixi
git commit -m "feat: initialize PixiJS game canvas and app"
```

---

## Phase 3-6 任务清单（详细版）

由于篇幅限制，以下是 Phase 3-6 的任务清单，每个任务都应该按 Phase 1-2 的详细程度展开：

### Phase 3: 智能体渲染系统

| Task | 文件 | 说明 | 预计时间 |
|------|------|------|----------|
| 3.1 | `src/components/pixi/AgentSprite.ts` | 智能体精灵类，支持多帧动画 | 1h |
| 3.2 | `src/components/pixi/MovementSystem.ts` | 移动系统，A* 路径寻路 | 1.5h |
| 3.3 | `src/components/pixi/SpeechBubble.ts` | 对话气泡渲染，支持滚动 | 1h |
| 3.4 | `src/components/pixi/ExpressionSystem.ts` | 表情系统，切换精灵帧 | 1h |
| 3.5 | `src/lib/websocket.ts` | WebSocket 客户端，状态同步 | 1.5h |

**Task 3.1 示例代码片段:**

```typescript
// src/components/pixi/AgentSprite.ts
import { Sprite, AnimatedSprite, Text, TextStyle } from 'pixi.js'

export class AgentSprite extends AnimatedSprite {
  public id: string
  public agentType: string
  private speechBubble?: Container

  constructor(data: AgentSpriteData) {
    super(getFramesForType(data.type))
    this.id = data.id
    this.agentType = data.type
    this.anchor.set(0.5)
    this.position.set(data.position.x, data.position.y)
    this.animationSpeed = 0.1
    this.play()
  }

  moveTo(targetX: number, targetY: number, duration: number) {
    // Tween animation
    gsap.to(this.position, {
      x: targetX,
      y: targetY,
      duration: duration / 1000,
      ease: 'linear',
    })
  }

  showSpeech(text: string, duration?: number) {
    // Create speech bubble above agent
    const style = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 14,
      wordWrap: true,
      wordWrapWidth: 200,
      fill: '#333',
    })
    // ... implementation
  }
}
```

### Phase 4: AG2 智能体服务

| Task | 文件 | 说明 | 预计时间 |
|------|------|------|----------|
| 4.1 | `backend/ai-service/app/agents/base.py` | 智能体基类，定义接口 | 1h |
| 4.2 | `backend/ai-service/app/agents/mentor.py` | 导师智能体实现 | 1.5h |
| 4.3 | `backend/ai-service/app/agents/designer.py` | 设计师智能体实现 | 1.5h |
| 4.4 | `backend/ai-service/app/agents/group_chat.py` | Group Chat 编排 | 2h |
| 4.5 | `backend/ai-service/app/api/websocket.py` | WebSocket 服务端 | 2h |

**Task 4.4 示例代码片段:**

```python
# backend/ai-service/app/agents/group_chat.py
from ag2 import GroupChat, GroupChatManager
from .mentor import MentorAgent
from .designer import DesignerAgent
from .analyst import AnalystAgent

class PBLGroupChat:
    def __init__(self, user_id: str, project_id: str):
        self.user_id = user_id
        self.project_id = project_id

        # Initialize agents
        self.mentor = MentorAgent("智慧导师")
        self.designer = DesignerAgent("创意设计师")
        self.analyst = AnalystAgent("数据分析师")

        # Create group chat
        self.group_chat = GroupChat(
            agents=[self.mentor, self.designer, self.analyst],
            messages=[],
            max_round=10,
        )

        self.manager = GroupChatManager(self.group_chat)

    async def send_message(self, message: str, sender: str = "user"):
        """Send message to group chat and get response"""
        response = await self.manager.send_message(message)
        return response

    async def assign_task(self, agent_type: str, task: str):
        """Assign specific task to specific agent"""
        agent = getattr(self, agent_type, None)
        if agent:
            return await agent.process(task)
        raise ValueError(f"Unknown agent type: {agent_type}")
```

### Phase 5: 项目任务系统

| Task | 文件 | 说明 | 预计时间 |
|------|------|------|----------|
| 5.1 | `frontend/src/app/api/projects/route.ts` | 项目 CRUD API | 1.5h |
| 5.2 | `backend/ai-service/app/agents/workflow.py` | 任务流程状态机 | 2h |
| 5.3 | `backend/ai-service/app/rag/retriever.py` | RAG 检索服务 | 2h |
| 5.4 | `backend/ai-service/app/rag/indexer.py` | 知识向量入库 | 1.5h |
| 5.5 | `docker/init-db/003-sample-projects.sql` | 3 个示例项目 SQL | 1h |

### Phase 6: 集成测试 + 优化

| Task | 文件 | 说明 | 预计时间 |
|------|------|------|----------|
| 6.1 | `frontend/__tests__/e2e/smoke.test.ts` | 端到端冒烟测试 | 1h |
| 6.2 | `backend/ai-service/tests/integration/test_agents.py` | Agent 集成测试 | 1h |
| 6.3 | 各组件优化 | 性能优化（缓存、懒加载） | 1h |
| 6.4 | 多设备测试 | 移动端/平板/桌面适配验证 | 0.5h |
| 6.5 | MVP 验收清单 | 功能验收测试 | 0.5h |

---

## 审查流程说明

### 设计文档审查（Design Review）

**审查者**: `everything-claude-code:architect` 或 `superpowers:receiving-code-review`

**审查要点**:
1. 架构设计是否合理
2. 技术选型是否恰当
3. 是否有遗漏的关键组件
4. 安全合规是否考虑周全

**审查命令**:
```
调用 subagent: everything-claude-code:architect
Prompt: "请审查 docs/superpowers/2026-03-21-visual-pbl-platform-design.md 设计文档，评估架构合理性和完整性"
```

### 计划文档审查（Plan Review）

**审查者**: `plan-document-reviewer` subagent

**审查要点**:
1. 任务分解是否足够细致
2. 每个任务是否有完整的代码示例
3. 测试用例是否覆盖关键场景
4. 任务依赖关系是否正确

**审查命令**:
```
调用 subagent: superpowers:receiving-code-review
Prompt: "请审查实施计划 docs/superpowers/plans/2026-03-21-visual-pbl-mvp-plan.md，评估任务完整性和可执行性"
```

### 两阶段审查（执行阶段）

**阶段 1: 代码审查** (`superpowers:receiving-code-review`)
- 代码是否正确实现需求
- 测试是否通过
- 代码风格是否符合规范
- 是否有明显的安全问题

**阶段 2: 验证审查** (`superpowers:verification-before-completion`)
- 功能是否满足用户需求
- 是否有边界情况遗漏
- 是否可以提交到主分支
- 是否需要补充文档

---

## 执行流程图

```
设计文档 → 设计审查 → 修改 → 设计批准
    ↓
实施计划 → 计划审查 → 修改 → 计划批准
    ↓
subagent-driven-development
    ├── Task 0.1 → 代码审查 → 验证审查 → Commit
    ├── Task 0.2 → 代码审查 → 验证审查 → Commit
    ├── Task 0.3 → 代码审查 → 验证审查 → Commit
    └── ... (继续直到所有任务完成)
    ↓
MVP 完成 → 集成测试 → 发布
```

---

## 下一步行动

1. **审查设计文档** - 调用 `everything-claude-code:architect` 审查设计文档
2. **审查实施计划** - 调用 `superpowers:receiving-code-review` 审查计划文档
3. **开始执行** - 调用 `superpowers:subagent-driven-development` 开始 Phase 0

**您希望先执行哪一步？**

A. 先审查设计文档（推荐）
B. 直接审查实施计划
C. 直接开始执行 Phase 0

---

**文档结束**
