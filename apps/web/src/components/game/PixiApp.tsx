'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Application, Assets, Texture } from 'pixi.js'
import { useAuth } from '@/hooks/useAuth'
import { CampusScene } from './scenes/CampusScene'
import { Player } from './entities/Player'

interface PixiAppProps {
  width?: number
  height?: number
  onSceneChange?: (sceneName: string) => void
}

export function PixiApp({ width = 800, height = 600, onSceneChange }: PixiAppProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { user, isLoading: authLoading } = useAuth()

  // Require authentication
  useEffect(() => {
    if (!authLoading && !user) {
      setError('You must be logged in to access the game')
    }
  }, [user, authLoading])

  // Initialize PixiJS Application
  useEffect(() => {
    if (!containerRef.current || authLoading || !user) return

    const initPixi = async () => {
      try {
        // Create Pixi Application
        const app = new Application()

        await app.init({
          width,
          height,
          backgroundColor: 0x1a1a2e,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
          antialias: false, // Disable for pixel art style
          preference: 'webgl2',
        })

        // Mount to DOM
        containerRef.current.appendChild(app.canvas as HTMLCanvasElement)

        appRef.current = app

        // Preload essential assets
        await preloadAssets()

        // Create and start the campus scene
        const campusScene = new CampusScene(app, width, height)
        await campusScene.load()
        campusScene.start()

        // Create player entity
        const player = new Player(app, campusScene)
        player.create()

        // Store scene reference for transitions
        ;(app as Application & { currentScene?: CampusScene; player?: Player }).currentScene = campusScene
        ;(app as Application & { currentScene?: CampusScene; player?: Player }).player = player

        setIsReady(true)

        // Handle window resize
        const handleResize = () => {
          handleWindowResize(app)
        }

        window.addEventListener('resize', handleResize)

        return () => {
          window.removeEventListener('resize', handleResize)
          campusScene.destroy()
          app.destroy(true)
        }
      } catch (err) {
        console.error('Failed to initialize PixiJS:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize game')
      }
    }

    initPixi()
  }, [user, authLoading, width, height])

  const preloadAssets = async () => {
    // Preload placeholder assets for pixel art
    // In production, these would be actual image files
    Assets.add('player-idle', createPlaceholderTexture(32, 32, 0x00ff00))
    Assets.add('player-walk-1', createPlaceholderTexture(32, 32, 0x00cc00))
    Assets.add('player-walk-2', createPlaceholderTexture(32, 32, 0x00aa00))
    Assets.add('ground-tile', createPlaceholderTexture(64, 64, 0x2d5016))
    Assets.add('wall-tile', createPlaceholderTexture(64, 64, 0x8b4513))
    Assets.add('tree', createPlaceholderTexture(48, 64, 0x228b22))
    Assets.add('building', createPlaceholderTexture(128, 96, 0xcd853f))

    await Assets.load([
      'player-idle',
      'player-walk-1',
      'player-walk-2',
      'ground-tile',
      'wall-tile',
      'tree',
      'building',
    ])
  }

  const createPlaceholderTexture = (w: number, h: number, color: number): string => {
    // Create a data URL for a simple colored rectangle
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`
      ctx.fillRect(0, 0, w, h)
    }
    return canvas.toDataURL('image/png')
  }

  const handleWindowResize = useCallback((app: Application) => {
    if (!containerRef.current) return

    const parent = containerRef.current.parentElement
    if (!parent) return

    const newWidth = parent.clientWidth || width
    const newHeight = parent.clientHeight || height

    app.renderer.resize(newWidth, newHeight)

    // Update scene if exists
    const appWithScene = app as Application & { currentScene?: CampusScene }
    if (appWithScene.currentScene) {
      appWithScene.currentScene.onResize(newWidth, newHeight)
    }
  }, [width, height])

  // Scene transition function
  const changeScene = useCallback(async (sceneName: string) => {
    const app = appRef.current
    if (!app) return

    const appWithScene = app as Application & { currentScene?: CampusScene; player?: Player }

    // Destroy current scene
    if (appWithScene.currentScene) {
      appWithScene.currentScene.destroy()
    }

    // Create new scene based on name
    let newScene: CampusScene

    switch (sceneName) {
      case 'campus':
        newScene = new CampusScene(app, width, height)
        break
      // Add more scenes here
      default:
        newScene = new CampusScene(app, width, height)
    }

    await newScene.load()
    newScene.start()

    // Recreate player
    if (appWithScene.player) {
      appWithScene.player.destroy()
    }
    const player = new Player(app, newScene)
    player.create()

    appWithScene.currentScene = newScene
    appWithScene.player = player

    onSceneChange?.(sceneName)
  }, [width, height, onSceneChange])

  // Expose scene transition globally for other components
  useEffect(() => {
    ;(window as typeof window & { __pixiApp?: { changeScene: typeof changeScene } }).__pixiApp = {
      changeScene,
    }

    return () => {
      delete (window as typeof window & { __pixiApp?: { changeScene: typeof changeScene } }).__pixiApp
    }
  }, [changeScene])

  if (authLoading) {
    return (
      <div
        ref={containerRef}
        className="flex items-center justify-center bg-gray-900"
        style={{ width, height }}
      >
        <div className="text-white text-lg">Loading authentication...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center bg-gray-900"
        style={{ width, height }}
      >
        <div className="text-red-400 text-lg">{error}</div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="overflow-hidden"
        style={{ width, height }}
      />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
          <div className="text-white text-lg">Loading game engine...</div>
        </div>
      )}
    </div>
  )
}

export default PixiApp
