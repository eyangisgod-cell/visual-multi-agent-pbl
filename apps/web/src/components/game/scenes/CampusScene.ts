import { Application, Container, Sprite, Graphics, Texture, TilingSprite } from 'pixi.js'
import { Assets } from 'pixi.js'

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
 * CampusScene - Main pixel-art virtual campus environment
 *
 * Creates a 2D top-down view of a campus with:
 * - Walkable ground tiles
 * - Buildings (collision zones)
 * - Trees and decorations
 * - Pathways between locations
 */
export class CampusScene {
  private app: Application
  private config: CampusSceneConfig
  private sceneContainer: Container
  private groundLayer: Container
  private objectLayer: Container
  private collisionLayer: Container
  private decorationsLayer: Container

  private groundTiles: TilingSprite[] = []
  private collisionTiles: CollisionTile[] = []
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
    this.sceneContainer.addChild(this.decorationsLayer)

    // Add to app stage
    this.app.stage.addChild(this.sceneContainer)

    // Build the campus
    this.buildGround()
    this.buildCollisions()
    this.buildObjects()
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
