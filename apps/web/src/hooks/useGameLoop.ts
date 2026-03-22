'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'

export interface GameLoopConfig {
  /** Target FPS for the game loop (default: 60) */
  targetFps?: number
  /** Whether the loop should start paused */
  startPaused?: boolean
  /** Callback called on each frame with delta time in ms */
  onUpdate?: (deltaTime: number, totalTime: number) => void
  /** Callback called when the loop starts */
  onStart?: () => void
  /** Callback called when the loop pauses/resumes */
  onPauseChange?: (isPaused: boolean) => void
}

export interface GameLoopReturn {
  /** Whether the game loop is currently running */
  isRunning: boolean
  /** Whether the game loop is currently paused */
  isPaused: boolean
  /** Current FPS (updated every second) */
  currentFps: number
  /** Total time elapsed in seconds */
  totalTime: number
  /** Start the game loop */
  start: () => void
  /** Stop the game loop */
  stop: () => void
  /** Pause the game loop */
  pause: () => void
  /** Resume the game loop */
  resume: () => void
  /** Toggle pause state */
  togglePause: () => void
}

/**
 * useGameLoop - Custom hook for 60 FPS game loop
 *
 * Uses requestAnimationFrame for smooth animation timing
 * Provides delta time for frame-rate independent movement
 *
 * @example
 * ```tsx
 * function GameComponent() {
 *   const { isRunning, currentFps, start, stop } = useGameLoop({
 *     targetFps: 60,
 *     onUpdate: (deltaTime) => {
 *       // Update game state based on delta time
 *       player.x += player.velocity * (deltaTime / 1000)
 *     }
 *   })
 *
 *   useEffect(() => {
 *     start()
 *     return () => stop()
 *   }, [])
 *
 *   return <div>FPS: {currentFps}</div>
 * }
 * ```
 */
export function useGameLoop(config: GameLoopConfig = {}): GameLoopReturn {
  const {
    targetFps = 60,
    startPaused = false,
    onUpdate,
    onStart,
    onPauseChange,
  } = config

  // Refs for loop state
  const requestRef = useRef<number | null>(null)
  const previousTimeRef = useRef<number | null>(null)
  const totalTimeRef = useRef<number>(0)
  const isRunningRef = useRef<boolean>(false)
  const isPausedRef = useRef<boolean>(startPaused)

  // FPS calculation
  const frameCountRef = useRef<number>(0)
  const lastFpsUpdateRef = useRef<number>(0)
  const currentFpsRef = useRef<number>(0)

  // React state for external consumption
  const [isRunning, setIsRunning] = useStateWrapper(false)
  const [isPaused, setIsPaused] = useStateWrapper(startPaused)
  const [currentFps, setCurrentFps] = useStateWrapper(0)
  const [totalTime, setTotalTime] = useStateWrapper(0)

  // Main game loop function
  const animate = useCallback((currentTime: number) => {
    if (!isRunningRef.current) return

    if (isPausedRef.current) {
      // Still schedule next frame but don't update
      previousTimeRef.current = currentTime
      requestRef.current = requestAnimationFrame(animate)
      return
    }

    // Calculate delta time
    if (previousTimeRef.current !== null) {
      const deltaTime = currentTime - previousTimeRef.current
      previousTimeRef.current = currentTime

      // Cap delta time to prevent huge jumps (e.g., when tab is backgrounded)
      const cappedDeltaTime = Math.min(deltaTime, 1000 / targetFps * 2)

      // Update total time
      totalTimeRef.current += cappedDeltaTime / 1000
      setTotalTime(totalTimeRef.current)

      // Call update callback
      if (onUpdate) {
        onUpdate(cappedDeltaTime, totalTimeRef.current)
      }
    } else {
      previousTimeRef.current = currentTime
    }

    // FPS calculation (update every 500ms)
    frameCountRef.current++
    const timeSinceFpsUpdate = currentTime - lastFpsUpdateRef.current
    if (timeSinceFpsUpdate >= 500) {
      currentFpsRef.current = Math.round(
        (frameCountRef.current * 1000) / timeSinceFpsUpdate
      )
      setCurrentFps(currentFpsRef.current)
      frameCountRef.current = 0
      lastFpsUpdateRef.current = currentTime
    }

    // Schedule next frame
    requestRef.current = requestAnimationFrame(animate)
  }, [onUpdate, targetFps, setTotalTime, setCurrentFps])

  // Start the game loop
  const start = useCallback(() => {
    if (isRunningRef.current) return

    isRunningRef.current = true
    setIsRunning(true)
    previousTimeRef.current = null
    frameCountRef.current = 0
    lastFpsUpdateRef.current = performance.now()

    requestRef.current = requestAnimationFrame(animate)

    if (onStart) {
      onStart()
    }

    console.log(`Game loop started at ${targetFps} FPS`)
  }, [animate, onStart, targetFps, setIsRunning])

  // Stop the game loop
  const stop = useCallback(() => {
    if (!isRunningRef.current) return

    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current)
      requestRef.current = null
    }

    isRunningRef.current = false
    setIsRunning(false)
    setIsPaused(false)
    previousTimeRef.current = null

    console.log('Game loop stopped')
  }, [setIsRunning, setIsPaused])

  // Pause the game loop
  const pause = useCallback(() => {
    if (!isRunningRef.current || isPausedRef.current) return

    isPausedRef.current = true
    setIsPaused(true)

    if (onPauseChange) {
      onPauseChange(true)
    }

    console.log('Game loop paused')
  }, [onPauseChange, setIsPaused])

  // Resume the game loop
  const resume = useCallback(() => {
    if (!isRunningRef.current || !isPausedRef.current) return

    isPausedRef.current = false
    setIsPaused(false)
    previousTimeRef.current = null // Reset to prevent large delta

    if (onPauseChange) {
      onPauseChange(false)
    }

    console.log('Game loop resumed')
  }, [onPauseChange, setIsPaused])

  // Toggle pause state
  const togglePause = useCallback(() => {
    if (isPausedRef.current) {
      resume()
    } else {
      pause()
    }
  }, [pause, resume])

  // Handle visibility change (pause when tab is hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRunningRef.current && !isPausedRef.current) {
        pause()
      } else if (!document.hidden && isRunningRef.current && isPausedRef.current) {
        resume()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [pause, resume])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [])

  return {
    isRunning,
    isPaused,
    currentFps,
    totalTime,
    start,
    stop,
    pause,
    resume,
    togglePause,
  }
}

/**
 * Helper to create state-like refs that don't trigger re-renders
 * but can be used like state setters
 */
function useStateWrapper<T>(initialValue: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(initialValue)

  // Create a ref to store the actual value without triggering renders
  const valueRef = useRef<T>(initialValue)

  // Custom setter that updates both ref and state
  const setWrapperValue = useCallback((newValue: T) => {
    valueRef.current = newValue
    setValue(newValue)
  }, [])

  // Return ref value for immediate access, setter for updates
  return [valueRef.current as T, setWrapperValue]
}

export default useGameLoop
