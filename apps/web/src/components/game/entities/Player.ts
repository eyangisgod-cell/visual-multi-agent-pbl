import { Application, Sprite, Container, Graphics, Assets } from 'pixi.js'
import { CampusScene } from '../scenes/CampusScene'

export interface PlayerConfig {
  speed: number
  startAtCenter: boolean
}

/**
 * Player - Player character entity with movement and collision
 *
 * Features:
 * - WASD/Arrow key movement
 * - Collision detection with scene objects
 * - Walking animation states
 * - Boundary constraints
 */
export class Player {
  private app: Application
  private scene: CampusScene
  private container: Container
  private sprite: Sprite | null = null
  private debugCollision: Graphics

  // Movement state
  private keysPressed: Set<string> = new Set()
  private velocity: { x: number; y: number } = { x: 0, y: 0 }
  private isMoving: boolean = false
  private direction: 'up' | 'down' | 'left' | 'right' = 'down'

  // Animation state
  private animationFrame: number = 0
  private animationTimer: number = 0
  private readonly ANIMATION_SPEED = 150 // ms per frame

  // Configuration
  private config: PlayerConfig = {
    speed: 200, // pixels per second
    startAtCenter: true,
  }

  // Player dimensions
  private readonly WIDTH = 32
  private readonly HEIGHT = 32

  constructor(app: Application, scene: CampusScene, config?: Partial<PlayerConfig>) {
    this.app = app
    this.scene = scene
    this.container = new Container()
    this.debugCollision = new Graphics()

    if (config) {
      this.config = { ...this.config, ...config }
    }
  }

  /**
   * Create the player entity
   */
  create(): void {
    // Create sprite
    this.createSprite()

    // Set initial position
    const spawnPos = this.scene.getSpawnPosition()

    // PixiJS 8.x: Use position.set() for setting position
    this.container.position.set(spawnPos.x, spawnPos.y)

    // Set up debug collision (optional, for development)
    this.setupDebugCollision()

    // Add to scene
    this.scene.getLayer().addChild(this.container)

    // Set up keyboard input
    this.setupInput()

    console.log('Player created at', spawnPos.x, spawnPos.y, 'Container position:', this.container.position)
  }

  /**
   * Create player sprite with animation frames
   */
  private createSprite(): void {
    const idleTexture = Assets.get('player-idle')
    this.sprite = new Sprite(idleTexture)

    // Center the sprite anchor
    this.sprite.anchor.set(0.5, 0.5)
    this.sprite.width = this.WIDTH
    this.sprite.height = this.HEIGHT

    this.container.addChild(this.sprite)
  }

  /**
   * Set up debug collision visualization
   */
  private setupDebugCollision(): void {
    this.debugCollision.alpha = 0.3
    this.debugCollision.visible = false // Hidden by default, press 'C' to toggle

    this.container.addChild(this.debugCollision)
  }

  /**
   * Set up keyboard input handlers
   */
  private setupInput(): void {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()

      // Movement keys
      if (['w', 'arrowup', 's', 'arrowdown', 'a', 'arrowleft', 'd', 'arrowright'].includes(key)) {
        this.keysPressed.add(key)
        this.isMoving = true
        e.preventDefault()
      }

      // Debug: toggle collision visualization
      if (key === 'c') {
        this.debugCollision.visible = !this.debugCollision.visible
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      this.keysPressed.delete(key)
      this.isMoving = this.keysPressed.size > 0
    }

    window.addEventListener('keydown', handleKeyDown, { capture: false })
    window.addEventListener('keyup', handleKeyUp, { capture: false })

    // Store cleanup reference
    ;(this.container as Container & { _cleanup?: () => void })._cleanup = () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }

  /**
   * Update player state (called by game loop)
   */
  update(deltaTime: number): void {
    // Calculate velocity from input
    this.calculateVelocity()

    // Apply movement with collision detection
    this.applyMovement(deltaTime)

    // Update animation
    this.updateAnimation(deltaTime)

    // Update debug collision visualization
    this.updateDebugCollision()
  }

  /**
   * Calculate velocity based on pressed keys
   */
  private calculateVelocity(): void {
    let vx = 0
    let vy = 0

    if (this.keysPressed.has('w') || this.keysPressed.has('arrowup')) {
      vy -= 1
      this.direction = 'up'
    }
    if (this.keysPressed.has('s') || this.keysPressed.has('arrowdown')) {
      vy += 1
      this.direction = 'down'
    }
    if (this.keysPressed.has('a') || this.keysPressed.has('arrowleft')) {
      vx -= 1
      this.direction = 'left'
    }
    if (this.keysPressed.has('d') || this.keysPressed.has('arrowright')) {
      vx += 1
      this.direction = 'right'
    }

    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0) {
      const length = Math.sqrt(vx * vx + vy * vy)
      vx /= length
      vy /= length
    }

    this.velocity = { x: vx, y: vy }
    this.isMoving = vx !== 0 || vy !== 0
  }

  /**
   * Apply movement with collision detection
   */
  private applyMovement(deltaTime: number): void {
    if (!this.isMoving) return

    const dt = deltaTime / 1000 // Convert to seconds
    const moveX = this.velocity.x * this.config.speed * dt
    const moveY = this.velocity.y * this.config.speed * dt

    // Calculate new position
    let newX = this.container.position.x + moveX
    let newY = this.container.position.y + moveY

    // Check collision with scene boundaries
    const sceneBounds = this.scene.getDimensions()

    // Check X-axis movement with collision
    if (!this.checkCollisionAtPosition(newX, this.container.position.y)) {
      newX = this.clampToBounds(newX, this.WIDTH, sceneBounds.width)
      this.container.position.x = newX
    }

    // Check Y-axis movement with collision
    if (!this.checkCollisionAtPosition(this.container.position.x, newY)) {
      newY = this.clampToBounds(newY, this.HEIGHT, sceneBounds.height)
      this.container.position.y = newY
    }
  }

  /**
   * Check collision at a specific position
   */
  private checkCollisionAtPosition(x: number, y: number): boolean {
    // Create collision box for player
    const playerLeft = x - this.WIDTH / 2
    const playerRight = x + this.WIDTH / 2
    const playerTop = y - this.HEIGHT / 2
    const playerBottom = y + this.HEIGHT / 2

    return this.scene.checkCollision(playerLeft, playerTop, this.WIDTH, this.HEIGHT)
  }

  /**
   * Clamp position within scene bounds
   */
  private clampToBounds(value: number, size: number, bounds: number): number {
    return Math.max(size / 2, Math.min(bounds - size / 2, value))
  }

  /**
   * Update sprite animation based on movement state
   */
  private updateAnimation(deltaTime: number): void {
    if (!this.sprite || !this.isMoving) return

    this.animationTimer += deltaTime

    if (this.animationTimer >= this.ANIMATION_SPEED) {
      this.animationTimer = 0
      this.animationFrame = (this.animationFrame + 1) % 2

      // Switch between walk frames
      const walkTexture = Assets.get(this.animationFrame === 0 ? 'player-walk-1' : 'player-walk-2')
      if (walkTexture) {
        this.sprite.texture = walkTexture
      }

      // Flip sprite based on direction
      if (this.direction === 'left') {
        this.sprite.scale.x = -1
      } else if (this.direction === 'right') {
        this.sprite.scale.x = 1
      }
    }
  }

  /**
   * Update debug collision visualization
   */
  private updateDebugCollision(): void {
    this.debugCollision.clear()
    this.debugCollision.rect(
      -this.WIDTH / 2,
      -this.HEIGHT / 2,
      this.WIDTH,
      this.HEIGHT
    )
    this.debugCollision.stroke({ width: 2, color: 0xff0000 })
  }

  /**
   * Get current player position
   */
  getPosition(): { x: number; y: number } {
    return { x: this.container.position.x, y: this.container.position.y }
  }

  /**
   * Set player position (for teleportation/scene transitions)
   */
  setPosition(x: number, y: number): void {
    this.container.position.set(x, y)
  }

  /**
   * Get current movement state
   */
  isMovingState(): boolean {
    return this.isMoving
  }

  /**
   * Get current direction
   */
  getDirection(): string {
    return this.direction
  }

  /**
   * Destroy the player entity
   */
  destroy(): void {
    // Clean up event listeners
    const container = this.container as Container & { _cleanup?: () => void }
    if (container._cleanup) {
      container._cleanup()
    }

    // Remove from scene
    this.container.destroy({ children: true })
  }
}

export default Player
