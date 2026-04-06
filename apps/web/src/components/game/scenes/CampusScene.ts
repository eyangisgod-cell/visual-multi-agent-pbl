import { Application, Container, Sprite, Graphics, Texture, TilingSprite } from 'pixi.js'
import { Assets } from 'pixi.js'
import { MentorAgent } from '../agents/MentorAgent'
import { SpeechBubble } from '../agents/SpeechBubble'

export interface CampusSceneConfig {
  width: number
  height: number
  tileWidth?: number
  tileHeight?: number
}

export interface CollisionTile {
  x: number
  y: number
  width: number
  height: number
  solid: boolean
}

/**
 * Get or create the E2E test agent layer
 */
function getE2eAgentLayer(): HTMLElement | null {
  if (typeof window === 'undefined') return null
  return document.getElementById('e2e-agent-layer')
}

/**
 * Create an E2E test marker element for an agent
 */
function createAgentMarker(agentId: string, name: string, x: number, y: number, onClick?: () => void): HTMLElement {
  const marker = document.createElement('div')
  marker.setAttribute('data-testid', `agent-${agentId}`)
  marker.setAttribute('data-agent-id', agentId)
  marker.setAttribute('data-agent-name', name)
  marker.setAttribute('data-position', `${Math.round(x)},${Math.round(y)}`)
  marker.setAttribute('data-animation-state', 'idle')
  marker.style.position = 'absolute'
  marker.style.left = `${x}px`
  marker.style.top = `${y}px`
  marker.style.width = '64px'
  marker.style.height = '96px'
  // Invisible but detectable by tests
  marker.style.opacity = '0'
  // Allow pointer events for E2E testing
  marker.style.pointerEvents = 'auto'
  marker.style.cursor = 'pointer'

  // Add click handler for E2E testing
  if (onClick) {
    marker.addEventListener('click', onClick)
  }

  return marker
}

/**
 * CampusScene - Main pixel-art virtual campus environment
 *
 * Creates a 2D top-down view of a campus with:
 * - Walkable ground tiles
 * - Buildings (collision zones)
 * - Trees and decorations
 * - Pathways between locations
 * - Agent sprites
 */
export class CampusScene {
  private app: Application
  private config: CampusSceneConfig
  private sceneContainer: Container
  private groundLayer: Container
  public objectLayer: Container
  private collisionLayer: Container
  private decorationsLayer: Container
  public agentLayer: Container

  private groundTiles: TilingSprite[] = []
  private collisionTiles: CollisionTile[] = []
  private agents: MentorAgent[] = []
  private speechBubbles: Map<string, SpeechBubble> = new Map()
  private agentMarkers: Map<string, HTMLElement> = new Map()
  private isLoaded = false
  private isStarted = false

  // Campus layout configuration (in tiles)
  private readonly CAMPUS_WIDTH = 40 // tiles
  private readonly CAMPUS_HEIGHT = 30 // tiles
  private readonly TILE_SIZE = 64 // pixels

  constructor(app: Application, width: number, height: number) {
    this.app = app
    this.config = {
      width,
      height,
      tileWidth: this.TILE_SIZE,
      tileHeight: this.TILE_SIZE,
    }

    this.sceneContainer = new Container()
    this.groundLayer = new Container()
    this.objectLayer = new Container()
    this.collisionLayer = new Container()
    this.decorationsLayer = new Container()
    this.agentLayer = new Container()
  }

  /**
   * Load all scene assets
   */
  async load(): Promise<void> {
    if (this.isLoaded) return

    try {
      // Assets are preloaded in PixiApp, just verify they exist
      const groundTexture = await Assets.load('ground-tile')
      const wallTexture = await Assets.load('wall-tile')
      const treeTexture = await Assets.load('tree')
      const buildingTexture = await Assets.load('building')

      console.log('CampusScene assets loaded')
      this.isLoaded = true
    } catch (error) {
      console.error('Failed to load campus scene assets:', error)
      throw error
    }
  }

  /**
   * Start the scene - create all visual elements
   */
  start(): void {
    if (this.isStarted) return

    // Set up layer hierarchy
    this.sceneContainer.addChild(this.groundLayer)
    this.sceneContainer.addChild(this.collisionLayer)
    this.sceneContainer.addChild(this.objectLayer)
    this.sceneContainer.addChild(this.agentLayer)
    this.sceneContainer.addChild(this.decorationsLayer)

    // Add to app stage
    this.app.stage.addChild(this.sceneContainer)

    // Build the campus
    this.buildGround()
    this.buildCollisions()
    this.buildObjects()
    this.buildAgents()
    this.buildDecorations()

    this.isStarted = true
    console.log('CampusScene started')
  }

  /**
   * Build ground tiles
   */
  private buildGround(): void {
    const texture = Assets.get('ground-tile')

    for (let x = 0; x < this.CAMPUS_WIDTH; x++) {
      for (let y = 0; y < this.CAMPUS_HEIGHT; y++) {
        const ground = new TilingSprite(texture, this.TILE_SIZE, this.TILE_SIZE)
        ground.x = x * this.TILE_SIZE
        ground.y = y * this.TILE_SIZE

        // Add slight variation for visual interest
        if ((x + y) % 3 === 0) {
          ground.tint = 0x3d6016
        } else if ((x + y) % 5 === 0) {
          ground.tint = 0x1d4006
        }

        this.groundLayer.addChild(ground)
        this.groundTiles.push(ground)
      }
    }

    // Create pathways
    this.createPathway(15, 0, 18, this.CAMPUS_HEIGHT) // Vertical main path
    this.createPathway(0, 12, this.CAMPUS_WIDTH, 15) // Horizontal main path
  }

  /**
   * Create a pathway (lighter colored ground)
   */
  private createPathway(startX: number, startY: number, endX: number, endY: number): void {
    const texture = Assets.get('ground-tile')

    for (let x = startX; x < endX; x++) {
      for (let y = startY; y < endY; y++) {
        const path = new TilingSprite(texture, this.TILE_SIZE, this.TILE_SIZE)
        path.x = x * this.TILE_SIZE
        path.y = y * this.TILE_SIZE
        path.tint = 0x5a5a5a // Gray pathway

        // Find and replace the ground tile at this position
        const existingTile = this.groundTiles.find(
          tile => tile.x === path.x && tile.y === path.y
        )
        if (existingTile) {
          existingTile.tint = 0x5a5a5a
        }
      }
    }
  }

  /**
   * Build collision zones (buildings, walls, etc.)
   */
  private buildCollisions(): void {
    // Building 1 - Main Hall (top left)
    this.addCollisionBox(2, 2, 8, 6, true)

    // Building 2 - Library (top right)
    this.addCollisionBox(28, 2, 10, 5, true)

    // Building 3 - Lab (bottom left)
    this.addCollisionBox(2, 22, 6, 6, true)

    // Building 4 - Cafeteria (bottom right)
    this.addCollisionBox(25, 20, 12, 8, true)

    // Walls around campus edges (partial)
    this.addCollisionBox(0, 0, this.CAMPUS_WIDTH, 1, true) // Top wall
    this.addCollisionBox(0, this.CAMPUS_HEIGHT - 1, this.CAMPUS_WIDTH, 1, true) // Bottom wall
    this.addCollisionBox(0, 0, 1, this.CAMPUS_HEIGHT, true) // Left wall
    this.addCollisionBox(this.CAMPUS_WIDTH - 1, 0, 1, this.CAMPUS_HEIGHT, true) // Right wall

    // Tree collision zones (smaller)
    this.addCollisionBox(10, 5, 1, 1, true)
    this.addCollisionBox(22, 8, 1, 1, true)
    this.addCollisionBox(8, 18, 1, 1, true)
    this.addCollisionBox(30, 16, 1, 1, true)
    this.addCollisionBox(5, 10, 1, 1, true)
    this.addCollisionBox(32, 25, 1, 1, true)
  }

  /**
   * Add a collision box to the scene
   */
  private addCollisionBox(x: number, y: number, width: number, height: number, solid: boolean): void {
    const graphics = new Graphics()

    if (solid) {
      // Visual representation of solid objects
      graphics.rect(0, 0, width * this.TILE_SIZE, height * this.TILE_SIZE)
      graphics.fill({ color: 0x8b4513 }) // Brown for buildings/walls
      graphics.stroke({ width: 2, color: 0x5a3a1a })
    } else {
      // Debug view for non-solid areas
      graphics.rect(0, 0, width * this.TILE_SIZE, height * this.TILE_SIZE)
      graphics.stroke({ width: 1, color: 0xff0000, alpha: 0.3 })
    }

    graphics.x = x * this.TILE_SIZE
    graphics.y = y * this.TILE_SIZE

    this.collisionLayer.addChild(graphics)

    this.collisionTiles.push({
      x: x * this.TILE_SIZE,
      y: y * this.TILE_SIZE,
      width: width * this.TILE_SIZE,
      height: height * this.TILE_SIZE,
      solid,
    })
  }

  /**
   * Build decorative objects (trees, benches, etc.)
   */
  private buildObjects(): void {
    const treeTexture = Assets.get('tree')
    const buildingTexture = Assets.get('building')

    // Add trees along pathways
    const treePositions = [
      { x: 10, y: 5 }, { x: 22, y: 8 }, { x: 8, y: 18 },
      { x: 30, y: 16 }, { x: 5, y: 10 }, { x: 32, y: 25 },
      { x: 12, y: 3 }, { x: 25, y: 10 }, { x: 18, y: 22 },
    ]

    treePositions.forEach(pos => {
      const tree = new Sprite(treeTexture)
      tree.x = pos.x * this.TILE_SIZE
      tree.y = pos.y * this.TILE_SIZE
      tree.scale.set(0.75)
      this.objectLayer.addChild(tree)
    })

    // Add building facades
    const buildings = [
      { x: 2, y: 2, name: 'Main Hall' },
      { x: 28, y: 2, name: 'Library' },
      { x: 2, y: 22, name: 'Lab' },
      { x: 25, y: 20, name: 'Cafeteria' },
    ]

    buildings.forEach(building => {
      const facade = new Sprite(buildingTexture)
      facade.x = building.x * this.TILE_SIZE
      facade.y = building.y * this.TILE_SIZE
      facade.scale.set(1, 1)
      this.objectLayer.addChild(facade)
    })
  }

  /**
   * Build ambient decorations (particles, lighting effects)
   */
  private buildDecorations(): void {
    // Add subtle lighting overlay
    const lighting = new Graphics()
    lighting.rect(0, 0, this.CAMPUS_WIDTH * this.TILE_SIZE, this.CAMPUS_HEIGHT * this.TILE_SIZE)
    lighting.fill({ color: 0xffffcc, alpha: 0.1 }) // Warm sunlight tint
    this.decorationsLayer.addChild(lighting)
  }

  /**
   * Build agent sprites in the scene
   */
  private buildAgents(): void {
    const e2eLayer = getE2eAgentLayer()

    // Clean up any existing markers before creating new ones
    if (e2eLayer) {
      e2eLayer.innerHTML = ''
    }
    this.agentMarkers.clear()

    // Create 5 platform agents at fixed positions
    const agentConfigs = [
      { id: 'mentor', name: '智慧导师', role: 'Mentor', x: 10, y: 8, primaryColor: 0x3498DB, secondaryColor: 0x2980B9, accessoryColor: 0x1ABC9C },
      { id: 'designer', name: '创意设计师', role: 'Designer', x: 25, y: 8, primaryColor: 0xE91E63, secondaryColor: 0xC2185B, accessoryColor: 0xF06292 },
      { id: 'analyst', name: '数据分析师', role: 'Analyst', x: 10, y: 20, primaryColor: 0x9B59B6, secondaryColor: 0x8E44AD, accessoryColor: 0xBB8FCE },
      { id: 'marketer', name: '运营推广师', role: 'Marketer', x: 25, y: 20, primaryColor: 0xF39C12, secondaryColor: 0xD68910, accessoryColor: 0xF5CBA7 },
      { id: 'assistant', name: 'CEO 助手', role: 'Assistant', x: 18, y: 14, primaryColor: 0x2ECC71, secondaryColor: 0x27AE60, accessoryColor: 0x58D68D },
    ]

    agentConfigs.forEach(config => {
      const agent = new MentorAgent(config.x * this.TILE_SIZE, config.y * this.TILE_SIZE)

      // Set up click handler to show speech bubble
      const handleClick = () => {
        this.showSpeechBubble(agent, `你好！我是${config.name}，很高兴为你服务。`)
      }
      agent.onClick = handleClick

      this.agents.push(agent)
      this.agentLayer.addChild(agent)

      // Create E2E test marker with click handler
      if (e2eLayer) {
        const marker = createAgentMarker(config.id, config.name, config.x * this.TILE_SIZE, config.y * this.TILE_SIZE, handleClick)
        e2eLayer.appendChild(marker)
        this.agentMarkers.set(config.id, marker)
      }
    })

    console.log(`CampusScene: ${this.agents.length} agents created`)
  }

  /**
   * Show speech bubble above an agent
   */
  public showSpeechBubble(agent: MentorAgent, text: string, duration: number = 3000): void {
    // Remove existing bubble for this agent
    const existingBubble = this.speechBubbles.get(agent.id)
    if (existingBubble) {
      existingBubble.destroy()
      this.speechBubbles.delete(agent.id)
    }

    // Create new speech bubble
    const bubble = new SpeechBubble({
      text,
      position: 'top',
      maxWidth: 180,
      backgroundColor: 0xFFFFFF,
      textColor: 0x333333,
      fontSize: 12,
      showTail: true,
      animated: true,
      duration,
    })

    // Position bubble above agent
    bubble.x = -40
    bubble.y = -80

    agent.addChild(bubble)
    this.speechBubbles.set(agent.id, bubble)

    // Update E2E marker with speaking state
    const marker = this.agentMarkers.get(agent.id)
    if (marker) {
      marker.setAttribute('data-speaking', 'true')
      setTimeout(() => {
        marker?.removeAttribute('data-speaking')
      }, duration)
    }
  }

  /**
   * Get all agents in the scene
   */
  public getAgents(): MentorAgent[] {
    return [...this.agents]
  }

  /**
   * Get agent by ID
   */
  public getAgentById(id: string): MentorAgent | undefined {
    return this.agents.find(agent => agent.id === id)
  }

  /**
   * Check collision at a given position
   */
  checkCollision(x: number, y: number, width: number, height: number): boolean {
    for (const tile of this.collisionTiles) {
      if (
        x < tile.x + tile.width &&
        x + width > tile.x &&
        y < tile.y + tile.height &&
        y + height > tile.y &&
        tile.solid
      ) {
        return true
      }
    }
    return false
  }

  /**
   * Get valid spawn positions (non-collision areas)
   */
  getSpawnPosition(): { x: number; y: number } {
    // Default spawn - center of campus
    return {
      x: (this.CAMPUS_WIDTH / 2) * this.TILE_SIZE,
      y: (this.CAMPUS_HEIGHT / 2) * this.TILE_SIZE,
    }
  }

  /**
   * Get object layer for adding entities
   */
  getLayer(): Container {
    return this.agentLayer
  }

  /**
   * Convert pixel coordinates to tile coordinates
   */
  pixelToTile(pixelX: number, pixelY: number): { tileX: number; tileY: number } {
    return {
      tileX: Math.floor(pixelX / this.TILE_SIZE),
      tileY: Math.floor(pixelY / this.TILE_SIZE),
    }
  }

  /**
   * Get scene dimensions
   */
  getDimensions(): { width: number; height: number } {
    return {
      width: this.CAMPUS_WIDTH * this.TILE_SIZE,
      height: this.CAMPUS_HEIGHT * this.TILE_SIZE,
    }
  }

  /**
   * Handle window resize
   */
  onResize(newWidth: number, newHeight: number): void {
    this.config.width = newWidth
    this.config.height = newHeight

    // Center camera on player (if player exists)
    // This will be implemented with camera follow
  }

  /**
   * Destroy the scene and clean up resources
   */
  destroy(): void {
    // Clean up E2E markers
    this.agentMarkers.forEach(marker => {
      marker.remove()
    })
    this.agentMarkers.clear()

    this.groundLayer.destroy({ children: true })
    this.objectLayer.destroy({ children: true })
    this.collisionLayer.destroy({ children: true })
    this.decorationsLayer.destroy({ children: true })
    this.sceneContainer.destroy({ children: true })

    this.isStarted = false
    this.isLoaded = false
  }
}

export default CampusScene
