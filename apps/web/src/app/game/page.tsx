'use client'

import { useEffect, useState } from 'react'
import { PixiApp } from '@/components/game/PixiApp'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { TaskPanel } from '@/components/game/TaskPanel'
import { AgentSelector } from '@/components/game/AgentSelector'

interface AgentDialog {
  agentId: string
  agentName: string
  messages: { role: string; content: string }[]
  isLoading: boolean
}

export default function GamePage() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const [gameSize, setGameSize] = useState({ width: 800, height: 600 })
  const [showTaskPanel, setShowTaskPanel] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [agentDialog, setAgentDialog] = useState<AgentDialog | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

  // Handle responsive game size
  useEffect(() => {
    const updateSize = () => {
      const container = document.getElementById('game-container')
      if (container) {
        setGameSize({
          width: Math.min(container.clientWidth, 1024),
          height: Math.min(container.clientHeight, 768),
        })
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Listen for agent click events from PixiJS
  useEffect(() => {
    const handleAgentClick = (event: CustomEvent<{ agentId: string; agentName: string }>) => {
      setAgentDialog({
        agentId: event.detail.agentId,
        agentName: event.detail.agentName,
        messages: [{ role: 'assistant', content: `你好！我是${event.detail.agentName}，很高兴为你服务。` }],
        isLoading: false,
      })
    }

    window.addEventListener('agent-click' as any, handleAgentClick as any)
    return () => window.removeEventListener('agent-click' as any, handleAgentClick as any)
  }, [])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || !agentDialog) return

    const userMessage = chatInput.trim()
    setChatInput('')
    setAgentDialog({
      ...agentDialog,
      messages: [...agentDialog.messages, { role: 'user', content: userMessage }],
      isLoading: true,
    })

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agentDialog.agentId,
          message: userMessage,
          context: { userId: user?.id },
        }),
      })

      const data = await response.json()

      setAgentDialog((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, { role: 'assistant', content: data.response || '抱歉，我暂时无法回答。' }],
              isLoading: false,
            }
          : null
      )
    } catch (error) {
      console.error('Chat error:', error)
      setAgentDialog((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, { role: 'assistant', content: '抱歉，遇到了技术问题。' }],
              isLoading: false,
            }
          : null
      )
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div>
            <h1 className="text-xl font-bold text-white">Virtual Campus</h1>
            <p className="text-sm text-gray-400">
              Welcome, {user.nickname || user.username}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowTaskPanel(!showTaskPanel)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-sm font-medium"
            >
              📋 任务
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              data-testid="sound-toggle"
              data-muted={!soundEnabled}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium"
              title={soundEnabled ? '静音' : '开启音效'}
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>
            <div className="text-sm text-gray-400">
              <span className="text-gray-500">Controls:</span>{' '}
              WASD or Arrow Keys to move
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Task Panel */}
      {showTaskPanel && <TaskPanel onClose={() => setShowTaskPanel(false)} />}

      {/* Agent Selector */}
      <AgentSelector
        onSelect={setSelectedAgent}
        selectedAgent={selectedAgent}
      />

      {/* Game Container */}
      <div
        id="game-container"
        className="flex items-center justify-center p-4"
        style={{ minHeight: 'calc(100vh - 80px)' }}
      >
        <div className="relative rounded-lg overflow-hidden shadow-2xl border-2 border-gray-700">
          <PixiApp
            width={gameSize.width}
            height={gameSize.height}
            onSceneChange={() => {}}
          />

          {/* Game UI Overlay */}
          <div className="absolute bottom-4 left-4 bg-gray-800 bg-opacity-75 rounded-lg px-3 py-2 text-white text-sm">
            <div>
              <span className="text-gray-400">Position:</span>{' '}
              <span id="position-display" data-testid="position-display">(0, 0)</span>
            </div>
          </div>

          {/* FPS Counter (optional debug) */}
          <div className="absolute top-4 right-4 bg-gray-800 bg-opacity-75 rounded-lg px-3 py-2 text-white text-sm">
            <span className="text-gray-400">FPS:</span>{' '}
            <span id="fps-display">60</span>
          </div>
        </div>
      </div>

      {/* Agent Dialog */}
      {agentDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg w-full max-w-md mx-4 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
              <h3 className="font-bold text-white">{agentDialog.agentName}</h3>
              <button
                onClick={() => setAgentDialog(null)}
                className="text-gray-400 hover:text-white"
                aria-label="关闭"
              >
                ✕
              </button>
            </div>

            {/* Chat Messages */}
            <div className="h-64 overflow-y-auto p-4 space-y-3">
              {agentDialog.messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-700 text-gray-100'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {agentDialog.isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-700 px-3 py-2 rounded-lg text-gray-400">
                    思考中...
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="输入消息..."
                  className="flex-1 px-3 py-2 bg-gray-800 rounded text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
                <button
                  type="submit"
                  disabled={agentDialog.isLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded font-medium disabled:opacity-50"
                >
                  发送
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
