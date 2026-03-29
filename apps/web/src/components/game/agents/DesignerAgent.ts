/**
 * DesignerAgent - 创意设计师
 *
 * The creative designer with artistic flair.
 * Primary color: Vibrant orange (creativity, energy)
 * Accessory: Paintbrush and beret
 */

import { Graphics } from 'pixi.js';
import { AgentSprite, AgentSpriteOptions } from './AgentSprite';

const DESIGNER_CONFIG: Omit<AgentSpriteOptions, 'x' | 'y'> = {
  id: 'designer',
  name: '创意设计师',
  role: 'Designer',
  description: '负责创意设计和视觉呈现',
  primaryColor: 0xE67E22,      // Vibrant orange
  secondaryColor: 0xF39C12,    // Golden orange
  accessoryColor: 0xE74C3C,    // Red (for beret)
};

export class DesignerAgent extends AgentSprite {
  private beret: Graphics;
  private paintbrush: Graphics;
  private palette: Graphics;

  constructor(x: number, y: number) {
    super({ ...DESIGNER_CONFIG, x, y, scale: 1.0 });

    // Add designer-specific features
    this.beret = this.createBeret();
    this.paintbrush = this.createPaintbrush();
    this.palette = this.createPalette();

    // Add beret on top of head
    this.addChildAt(this.beret, this.getChildIndex(this.head) + 1);
    this.addChild(this.paintbrush);
    this.addChild(this.palette);
  }

  /**
   * Create a stylish beret
   */
  private createBeret(): Graphics {
    const graphics = new Graphics();

    // Beret base
    graphics.beginFill(this.getAccessoryColor());
    graphics.drawEllipse(0, -42, 28, 12);
    graphics.endFill();

    // Beret top (tilted)
    graphics.beginFill(this.getAccessoryColor());
    graphics.drawCircle(-3, -45, 15);
    graphics.endFill();

    // Small pom-pom
    graphics.beginFill(0xC0392B);
    graphics.drawCircle(-12, -52, 4);
    graphics.endFill();

    return graphics;
  }

  /**
   * Create a paintbrush held by the designer
   */
  private createPaintbrush(): Graphics {
    const graphics = new Graphics();

    // Brush handle
    graphics.beginFill(0xD35400);
    graphics.drawRect(25, 35, 4, 20);
    graphics.endFill();

    // Brush metal ferrule
    graphics.beginFill(0x95A5A6);
    graphics.drawRect(24, 32, 6, 5);
    graphics.endFill();

    // Brush bristles
    graphics.beginFill(0x3498DB);
    graphics.moveTo(24, 32);
    graphics.lineTo(22, 26);
    graphics.lineTo(28, 26);
    graphics.lineTo(28, 32);
    graphics.closePath();
    graphics.endFill();

    // Paint on brush tip
    graphics.beginFill(0xE74C3C);
    graphics.drawCircle(25, 25, 3);
    graphics.endFill();

    return graphics;
  }

  /**
   * Create an artist palette
   */
  private createPalette(): Graphics {
    const graphics = new Graphics();

    // Palette base
    graphics.beginFill(0xD4AC6E);
    graphics.drawEllipse(25, 10, 16, 12);
    graphics.endFill();

    // Paint blobs
    graphics.beginFill(0xE74C3C);
    graphics.drawCircle(20, 8, 3);

    graphics.beginFill(0x3498DB);
    graphics.drawCircle(28, 8, 3);

    graphics.beginFill(0x2ECC71);
    graphics.drawCircle(24, 14, 3);

    graphics.beginFill(0xF39C12);
    graphics.drawCircle(30, 12, 3);

    graphics.endFill();

    // Thumb hole
    graphics.beginFill(0x000000, 0.3);
    graphics.drawCircle(15, 10, 3);
    graphics.endFill();

    return graphics;
  }

  protected override createAccessory(color: number): Graphics {
    const graphics = new Graphics();

    // Artist smock
    graphics.beginFill(color);
    graphics.drawRect(-14, 5, 28, 45);
    graphics.endFill();

    // Smock pockets
    graphics.lineStyle(1, 0xC0392B);
    graphics.drawRect(-10, 20, 10, 12);
    graphics.drawRect(0, 20, 10, 12);

    return graphics;
  }

  protected override drawThinkingIndicator(): void {
    super.drawThinkingIndicator();

    // Add lightbulb icon (creative idea)
    this.statusIndicator.beginFill(0xF1C40F);
    this.statusIndicator.drawCircle(20, -48, 5);
    this.statusIndicator.endFill();

    // Light rays
    this.statusIndicator.lineStyle(2, 0xF1C40F);
    this.statusIndicator.moveTo(20, -53);
    this.statusIndicator.lineTo(20, -57);
    this.statusIndicator.moveTo(25, -45);
    this.statusIndicator.lineTo(28, -42);
    this.statusIndicator.moveTo(15, -45);
    this.statusIndicator.lineTo(12, -42);
  }

  /**
   * Get accessory color from parent config
   */
  protected getAccessoryColor(): number {
    return DESIGNER_CONFIG.accessoryColor;
  }
}

export default DesignerAgent;
