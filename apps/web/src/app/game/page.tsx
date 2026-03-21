'use client'

import { useEffect, useState } from 'react'
import { PixiApp } from '@/components/game/PixiApp'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

export default function GamePage() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const [gameSize, setGameSize] = useState({ width: 800, height: 600 })

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

  const handleSceneChange = (sceneName: string) => {
    console.log('Scene changed to:', sceneName)
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
            onSceneChange={handleSceneChange}
          />

          {/* Game UI Overlay */}
          <div className="absolute bottom-4 left-4 bg-gray-800 bg-opacity-75 rounded-lg px-3 py-2 text-white text-sm">
            <div>
              <span className="text-gray-400">Position:</span>{' '}
              <span id="position-display">Loading...</span>
            </div>
          </div>

          {/* FPS Counter (optional debug) */}
          <div className="absolute top-4 right-4 bg-gray-800 bg-opacity-75 rounded-lg px-3 py-2 text-white text-sm">
            <span className="text-gray-400">FPS:</span>{' '}
            <span id="fps-display">60</span>
          </div>
        </div>
      </div>
    </div>
  )
}
