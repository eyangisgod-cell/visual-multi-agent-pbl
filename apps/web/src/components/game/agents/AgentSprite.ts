/**
 * AgentSprite - Base class for AI Agent sprites in PixiJS
 *
 * Provides common functionality for all agent types including:
 * - Sprite rendering with pixel-art style
 * - Status indicators (idle, thinking, speaking, working)
 * - Hover and click interactions
 * - Basic animations
 */

import {
  Container,
  Graphics,
  Sprite,
  Text,
  TextStyle,
  FederatedPointerEvent,
  Texture,
} from 'pixi.js';

export type AgentStatus = 'idle' | 'thinking' | 'speaking' | 'working';

export interface AgentSpriteOptions {
  id: string;
  name: string;
  role: string;
  description: string;
  primaryColor: number;
  secondaryColor: number;
  accessoryColor: number;
  x: number;
  y: number;
  scale?: number;
}

export interface AgentState {
  status: AgentStatus;
  isHovered: boolean;
  isSelected: boolean;
  isVisible: boolean;
  targetX: number;
  targetY: number;
}

export class AgentSprite extends Container {
  // Core properties
  public readonly id: string;
  public readonly name: string;
  public readonly role: string;
  public readonly description: string;

  // State
  protected state: AgentState;

  // Visual components
  protected body: Graphics;
  protected head: Graphics;
  protected eyes: Graphics;
  protected accessory: Graphics;
  protected statusIndicator: Graphics;
  protected nameLabel: Text;
  protected selectionHighlight: Graphics;

  // Animation
  protected bounceOffset: number = 0;
  protected bounceDirection: number = 1;
  protected blinkTimer: number = 0;
  protected isBlinking: boolean = false;

  // Callbacks
  public onClick?: (agent: AgentSprite) => void;
  public onHoverChange?: (agent: AgentSprite, isHovered: boolean) => void;
  public onStatusChange?: (agent: AgentSprite, status: AgentStatus) => void;

  constructor(options: AgentSpriteOptions) {
    super();

    // Basic properties
    this.id = options.id;
    this.name = options.name;
    this.role = options.role;
    this.description = options.description;

    // State initialization
    this.state = {
      status: 'idle',
      isHovered: false,
      isSelected: false,
      isVisible: true,
      targetX: options.x,
      targetY: options.y,
    };

    // Set position and scale
    this.x = options.x;
    this.y = options.y;
    this.scale.set(options.scale ?? 1);

    // Create visual components
    this.selectionHighlight = this.createSelectionHighlight();
    this.body = this.createBody(options.primaryColor);
    this.head = this.createHead(options.primaryColor);
    this.eyes = this.createEyes();
    this.accessory = this.createAccessory(options.accessoryColor);
    this.statusIndicator = this.createStatusIndicator();
    this.nameLabel = this.createNameLabel(options.name, options.secondaryColor);

    // Add children in render order
    this.addChild(this.selectionHighlight);
    this.addChild(this.body);
    this.addChild(this.head);
    this.addChild(this.eyes);
    this.addChild(this.accessory);
    this.addChild(this.statusIndicator);
    this.addChild(this.nameLabel);

    // Setup interactivity
    this.setupInteractivity();

    // Start animation loop
    this.startAnimations();
  }

  /**
   * Create the agent's body (pixel-art style rectangle)
   */
  protected createBody(color: number): Graphics {
    const graphics = new Graphics();
    graphics.beginFill(color);
    // Pixel-art body: rounded rectangle
    graphics.drawRoundedRect(-20, 0, 40, 50, 8);
    graphics.endFill();

    // Add subtle gradient effect
    graphics.beginFill(color, 0.3);
    graphics.drawRoundedRect(-15, 5, 30, 40, 4);
    graphics.endFill();

    return graphics;
  }

  /**
   * Create the agent's head
   */
  protected createHead(color: number): Graphics {
    const graphics = new Graphics();
    graphics.beginFill(color);
    // Pixel-art head: circle-ish
    graphics.drawCircle(0, -25, 22);
    graphics.endFill();

    return graphics;
  }

  /**
   * Create the agent's eyes
   */
  protected createEyes(): Graphics {
    const graphics = new Graphics();

    // Left eye
    graphics.beginFill(0xFFFFFF);
    graphics.drawCircle(-8, -28, 6);
    graphics.endFill();
    graphics.beginFill(0x000000);
    graphics.drawCircle(-6, -28, 3);
    graphics.endFill();

    // Right eye
    graphics.beginFill(0xFFFFFF);
    graphics.drawCircle(8, -28, 6);
    graphics.endFill();
    graphics.beginFill(0x000000);
    graphics.drawCircle(6, -28, 3);
    graphics.endFill();

    return graphics;
  }

  /**
   * Create agent-specific accessory (to be overridden by subclasses)
   */
  protected createAccessory(color: number): Graphics {
    const graphics = new Graphics();
    // Default: simple collar
    graphics.beginFill(color);
    graphics.drawRect(-10, 5, 20, 8);
    graphics.endFill();

    return graphics;
  }

  /**
   * Create status indicator (above head)
   */
  protected createStatusIndicator(): Graphics {
    const graphics = new Graphics();
    graphics.visible = false;
    return graphics;
  }

  /**
   * Create name label
   */
  protected createNameLabel(name: string, color: number): Text {
    const style = new TextStyle({
      fontSize: 14,
      fontWeight: 'bold',
      fill: color,
      stroke: { color: 0x000000, width: 3 },
      align: 'center',
    });

    const text = new Text(name, style);
    text.anchor.set(0.5);
    text.y = 65;

    return text;
  }

  /**
   * Create selection highlight ring
   */
  protected createSelectionHighlight(): Graphics {
    const graphics = new Graphics();
    graphics.visible = false;
    graphics.lineStyle(3, 0xFFFF00, 0.8);
    graphics.drawCircle(0, 12, 35);
    return graphics;
  }

  /**
   * Setup mouse/touch interactivity
   */
  protected setupInteractivity(): void {
    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.on('pointerenter', this.handlePointerEnter);
    this.on('pointerleave', this.handlePointerLeave);
    this.on('pointerdown', this.handlePointerDown);
    this.on('pointerup', this.handlePointerUp);
  }

  protected handlePointerEnter = (e: FederatedPointerEvent): void => {
    this.state.isHovered = true;
    this.onHoverChange?.(this, true);
    this.updateVisuals();
  };

  protected handlePointerLeave = (e: FederatedPointerEvent): void => {
    this.state.isHovered = false;
    this.onHoverChange?.(this, false);
    this.updateVisuals();
  };

  protected handlePointerDown = (e: FederatedPointerEvent): void => {
    this.scale.set((this.state.isSelected ? 1 : 1.15));
  };

  protected handlePointerUp = (e: FederatedPointerEvent): void => {
    this.scale.set((this.state.isSelected ? 1.1 : 1));
    this.onClick?.(this);
  };

  /**
   * Update visual appearance based on state
   */
  protected updateVisuals(): void {
    // Scale based on hover/selection
    const baseScale = this.state.isSelected ? 1.1 : 1;
    const hoverScale = this.state.isHovered ? 1.05 : 1;
    this.scale.set(baseScale * hoverScale);

    // Update selection highlight visibility
    this.selectionHighlight.visible = this.state.isSelected;
  }

  /**
   * Start idle animation loop
   */
  protected startAnimations(): void {
    const animate = (): void => {
      // Idle bounce animation
      if (this.state.status === 'idle' && !this.state.isHovered) {
        this.bounceOffset += 0.05 * this.bounceDirection;
        if (Math.abs(this.bounceOffset) > 2) {
          this.bounceDirection *= -1;
        }
        this.y = this.state.targetY + this.bounceOffset;
      }

      // Blink animation
      this.blinkTimer++;
      if (this.blinkTimer > 180 && !this.isBlinking) {
        this.isBlinking = true;
        this.eyes.alpha = 0.1;
        setTimeout(() => {
          this.isBlinking = false;
          this.eyes.alpha = 1;
          this.blinkTimer = 0;
        }, 150);
      }

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  /**
   * Update agent status
   */
  public setStatus(status: AgentStatus): void {
    this.state.status = status;
    this.updateStatusIndicator();
    this.onStatusChange?.(this, status);
  }

  /**
   * Get current status
   */
  public getStatus(): AgentStatus {
    return this.state.status;
  }

  /**
   * Update status indicator visuals
   */
  protected updateStatusIndicator(): void {
    this.statusIndicator.clear();

    switch (this.state.status) {
      case 'thinking':
        this.drawThinkingIndicator();
        break;
      case 'speaking':
        this.drawSpeakingIndicator();
        break;
      case 'working':
        this.drawWorkingIndicator();
        break;
      case 'idle':
      default:
        this.statusIndicator.visible = false;
        break;
    }
  }

  protected drawThinkingIndicator(): void {
    this.statusIndicator.visible = true;
    this.statusIndicator.beginFill(0x9B59B6, 0.8);
    this.statusIndicator.drawCircle(15, -40, 8);
    this.statusIndicator.endFill();

    // Little sparkles
    this.statusIndicator.beginFill(0xFFFF00);
    this.statusIndicator.drawCircle(20, -45, 3);
    this.statusIndicator.drawCircle(10, -48, 2);
    this.statusIndicator.endFill();
  }

  protected drawSpeakingIndicator(): void {
    this.statusIndicator.visible = true;
    this.statusIndicator.beginFill(0x3498DB, 0.8);
    this.statusIndicator.drawCircle(15, -40, 8);
    this.statusIndicator.endFill();

    // Sound waves
    this.statusIndicator.lineStyle(2, 0x3498DB);
    this.statusIndicator.arc(0, -40, 12, Math.PI * 0.2, Math.PI * 0.8);
    this.statusIndicator.arc(0, -40, 16, Math.PI * 0.15, Math.PI * 0.85);
  }

  protected drawWorkingIndicator(): void {
    this.statusIndicator.visible = true;
    this.statusIndicator.beginFill(0x2ECC71, 0.8);
    this.statusIndicator.drawCircle(15, -40, 8);
    this.statusIndicator.endFill();

    // Gear/progress
    this.statusIndicator.lineStyle(2, 0xFFFFFF);
    this.statusIndicator.drawCircle(15, -40, 5);
  }

  /**
   * Set selection state
   */
  public setSelected(selected: boolean): void {
    this.state.isSelected = selected;
    this.updateVisuals();
  }

  /**
   * Get selection state
   */
  public isSelected(): boolean {
    return this.state.isSelected;
  }

  /**
   * Move agent to new position
   */
  public moveTo(x: number, y: number, duration?: number): void {
    if (duration === undefined) {
      this.x = x;
      this.y = y;
      this.state.targetX = x;
      this.state.targetY = y;
    } else {
      this.state.targetX = x;
      this.state.targetY = y;
      // Simple lerp would be handled in update loop
    }
  }

  /**
   * Get current state for serialization
   */
  public getState(): AgentState {
    return { ...this.state };
  }

  /**
   * Show/hide agent
   */
  public setVisible(visible: boolean): void {
    this.state.isVisible = visible;
    this.visible = visible;
  }
}

export default AgentSprite;
