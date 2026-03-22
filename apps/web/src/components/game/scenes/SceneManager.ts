import { Application, Container, Graphics, Texture, Sprite } from 'pixi.js'
import { CampusScene } from './scenes/CampusScene'

export type SceneName = 'campus' | 'building-interior' | 'courtyard'

export interface SceneTransitionConfig {
  /** Duration of the transition in milliseconds */
  duration?: number
  /** Type of transition effect */
  type?: 'fade' | 'slide' | 'circle' | 'instant'
  /** Color of the transition (default: black) */
  color?: number
}

export interface SceneData {
  name: SceneName
  scene: CampusScene
  playerSpawn?: { x: number; y: number }
}

/**
 * SceneManager - Manages scene loading and transitions
 *
 * Features:
 * - Scene registration and loading
 * - Smooth transitions between scenes
 * - Player spawn position management
 * - Scene lifecycle events
 */
export class SceneManager {
  private app: Application
  private scenes: Map<SceneName, SceneData> = new Map()
  private currentScene: SceneData | null = null
  private transitionLayer: Container
  private isTransitioning: boolean = false

  // Default transition config
  private defaultTransition: Required<SceneTransitionConfig> = {
    duration: 500,
    type: 'fade',
    color: 0x000000,
  }

  constructor(app: Application) {
    this.app = app
    this.transitionLayer = new Container()
    this.app.stage.addChild(this.transitionLayer)
  }

  /**
   * Register a scene with the manager
   */
  registerScene(name: SceneName, scene: CampusScene, playerSpawn?: { x: number; y: number }): void {
    this.scenes.set(name, {
      name,
      scene,
      playerSpawn,
    })
    console.log(`Scene registered: ${name}`)
  }

  /**
   * Load and start a scene by name
   */
  async loadScene(name: SceneName, transition?: SceneTransitionConfig): Promise<void> {
    const targetScene = this.scenes.get(name)

    if (!targetScene) {
      console.error(`Scene not found: ${name}`)
      return
    }

    if (this.isTransitioning) {
      console.warn('Already transitioning, ignoring scene change')
      return
    }

    const config = { ...this.defaultTransition, ...transition }

    // If no current scene, just start the new one
    if (!this.currentScene) {
      await targetScene.scene.load()
      targetScene.scene.start()
      this.currentScene = targetScene

      if (targetScene.playerSpawn) {
        // Set player spawn position (player will be created by PixiApp)
      }

      return
    }

    // Perform transition
    this.isTransitioning = true

    // Start transition animation
    await this.performTransition(config)

    // Destroy old scene
    this.currentScene.scene.destroy()

    // Load and start new scene
    await targetScene.scene.load()
    targetScene.scene.start()
    this.currentScene = targetScene

    // End transition
    await this.endTransition(config)

    this.isTransitioning = false
    console.log(`Transitioned to scene: ${name}`)
  }

  /**
   * Perform the transition animation
   */
  private async performTransition(config: Required<SceneTransitionConfig>): Promise<void> {
    return new Promise((resolve) => {
      switch (config.type) {
        case 'fade':
          this.fadeTransition(config, true, resolve)
          break
        case 'slide':
          this.slideTransition(config, true, resolve)
          break
        case 'circle':
          this.circleTransition(config, true, resolve)
          break
        case 'instant':
          resolve()
          break
      }
    })
  }

  /**
   * End the transition animation
   */
  private async endTransition(config: Required<SceneTransitionConfig>): Promise<void> {
    return new Promise((resolve) => {
      switch (config.type) {
        case 'fade':
          this.fadeTransition(config, false, resolve)
          break
        case 'slide':
          this.slideTransition(config, false, resolve)
          break
        case 'circle':
          this.circleTransition(config, false, resolve)
          break
        case 'instant':
          resolve()
          break
      }
    })
  }

  /**
   * Fade transition effect
   */
  private fadeTransition(
    config: Required<SceneTransitionConfig>,
    fadeIn: boolean,
    onComplete: () => void
  ): void {
    const graphics = new Graphics()
    graphics.rect(0, 0, this.app.screen.width, this.app.screen.height)
    graphics.fill({ color: config.color, alpha: fadeIn ? 0 : 1 })
    this.transitionLayer.addChild(graphics)

    const startTime = performance.now()
    const animate = () => {
      const elapsed = performance.now() - startTime
      const progress = Math.min(elapsed / config.duration, 1)

      graphics.clear()
      graphics.rect(0, 0, this.app.screen.width, this.app.screen.height)
      graphics.fill({
        color: config.color,
        alpha: fadeIn ? progress : 1 - progress,
      })

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        graphics.destroy()
        onComplete()
      }
    }

    requestAnimationFrame(animate)
  }

  /**
   * Slide transition effect
   */
  private slideTransition(
    config: Required<SceneTransitionConfig>,
    slideIn: boolean,
    onComplete: () => void
  ): void {
    const graphics = new Graphics()
    const screenWidth = this.app.screen.width
    const screenHeight = this.app.screen.height

    graphics.rect(0, 0, screenWidth, screenHeight)
    graphics.fill({ color: config.color })
    graphics.x = slideIn ? -screenWidth : 0
    this.transitionLayer.addChild(graphics)

    const startTime = performance.now()
    const animate = () => {
      const elapsed = performance.now() - startTime
      const progress = Math.min(elapsed / config.duration, 1)

      // Easing function (ease-in-out)
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2

      graphics.x = slideIn ? -screenWidth + screenWidth * eased : screenWidth * eased

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        graphics.destroy()
        onComplete()
      }
    }

    requestAnimationFrame(animate)
  }

  /**
   * Circle wipe transition effect
   */
  private circleTransition(
    config: Required<SceneTransitionConfig>,
    expand: boolean,
    onComplete: () => void
  ): void {
    const graphics = new Graphics()
    const centerX = this.app.screen.width / 2
    const centerY = this.app.screen.height / 2
    const maxRadius = Math.sqrt(
      Math.pow(this.app.screen.width, 2) + Math.pow(this.app.screen.height, 2)
    ) / 2

    this.transitionLayer.addChild(graphics)

    const startTime = performance.now()
    const animate = () => {
      const elapsed = performance.now() - startTime
      const progress = Math.min(elapsed / config.duration, 1)

      // Easing function
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2

      const currentRadius = expand
        ? eased * maxRadius
        : (1 - eased) * maxRadius

      graphics.clear()

      // Draw inverse circle (screen minus circle)
      graphics.beginPath()
      graphics.rect(0, 0, this.app.screen.width, this.app.screen.height)
      graphics.closePath()
      graphics.fill({ color: config.color })

      // Cut out circle
      graphics.beginPath()
      graphics.circle(centerX, centerY, currentRadius)
      graphics.closePath()
      graphics.cut()

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        graphics.destroy()
        onComplete()
      }
    }

    requestAnimationFrame(animate)
  }

  /**
   * Get the current scene
   */
  getCurrentScene(): CampusScene | null {
    return this.currentScene?.scene ?? null
  }

  /**
   * Get the current scene name
   */
  getCurrentSceneName(): SceneName | null {
    return this.currentScene?.name ?? null
  }

  /**
   * Check if a transition is in progress
   */
  getIsTransitioning(): boolean {
    return this.isTransitioning
  }

  /**
   * Handle screen resize
   */
  onResize(width: number, height: number): void {
    // Update all scenes
    this.scenes.forEach((sceneData) => {
      sceneData.scene.onResize(width, height)
    })
  }

  /**
   * Destroy the scene manager and all scenes
   */
  destroy(): void {
    this.scenes.forEach((sceneData) => {
      sceneData.scene.destroy()
    })
    this.scenes.clear()
    this.transitionLayer.destroy({ children: true })
    this.currentScene = null
  }
}

export default SceneManager
