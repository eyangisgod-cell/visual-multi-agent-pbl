/**
 * MentorAgent - 智慧导师
 *
 * The wise mentor figure with glasses and a scholarly appearance.
 * Primary color: Deep purple (wisdom, knowledge)
 * Accessory: Glasses and book
 */

import { Graphics } from 'pixi.js';
import { AgentSprite, AgentSpriteOptions } from './AgentSprite';

const MENTOR_CONFIG: Omit<AgentSpriteOptions, 'x' | 'y'> = {
  id: 'mentor',
  name: '智慧导师',
  role: 'Mentor',
  description: '提供学术指导和知识支持',
  primaryColor: 0x8E44AD,      // Deep purple
  secondaryColor: 0x9B59B6,    // Light purple
  accessoryColor: 0xF39C12,    // Gold (for glasses)
};

export class MentorAgent extends AgentSprite {
  private glasses: Graphics;
  private book: Graphics;

  constructor(x: number, y: number) {
    super({ ...MENTOR_CONFIG, x, y, scale: 1.1 });

    // Add mentor-specific features
    this.glasses = this.createGlasses();
    this.book = this.createBook();

    // Insert glasses between head and accessory
    this.addChildAt(this.glasses, this.getChildIndex(this.eyes) + 1);
    this.addChild(this.book);

    // Make the mentor slightly larger to convey wisdom
    this.scale.set(1.15);
  }

  /**
   * Create glasses for the mentor
   */
  private createGlasses(): Graphics {
    const graphics = new Graphics();

    // Left lens frame
    graphics.lineStyle(2, this.getAccessoryColor(), 1);
    graphics.drawCircle(-8, -28, 7);

    // Right lens frame
    graphics.drawCircle(8, -28, 7);

    // Bridge
    graphics.lineStyle(2, this.getAccessoryColor(), 1);
    graphics.moveTo(-1, -28);
    graphics.lineTo(1, -28);

    // Temple arms
    graphics.moveTo(-15, -28);
    graphics.lineTo(-22, -25);
    graphics.moveTo(15, -28);
    graphics.lineTo(22, -25);

    return graphics;
  }

  /**
   * Create a book held by the mentor
   */
  private createBook(): Graphics {
    const graphics = new Graphics();

    // Book cover
    graphics.beginFill(0x6C3483);
    graphics.drawRoundedRect(15, 20, 18, 24, 3);
    graphics.endFill();

    // Book pages
    graphics.beginFill(0xFFFFFF);
    graphics.drawRect(17, 22, 14, 20);
    graphics.endFill();

    // Book lines (text)
    graphics.lineStyle(1, 0x333333);
    graphics.moveTo(19, 26);
    graphics.lineTo(29, 26);
    graphics.moveTo(19, 30);
    graphics.lineTo(29, 30);
    graphics.moveTo(19, 34);
    graphics.lineTo(29, 34);
    graphics.moveTo(19, 38);
    graphics.lineTo(29, 38);

    return graphics;
  }

  protected override createAccessory(color: number): Graphics {
    const graphics = new Graphics();

    // Scholar collar
    graphics.beginFill(color);
    graphics.drawRect(-12, 5, 24, 6);
    graphics.endFill();

    // Tie
    graphics.beginFill(0x2C3E50);
    graphics.moveTo(0, 11);
    graphics.lineTo(-4, 20);
    graphics.lineTo(0, 25);
    graphics.lineTo(4, 20);
    graphics.closePath();
    graphics.endFill();

    return graphics;
  }

  protected override drawThinkingIndicator(): void {
    super.drawThinkingIndicator();

    // Add graduation cap icon
    this.statusIndicator.beginFill(0xF39C12);
    this.statusIndicator.moveTo(10, -50);
    this.statusIndicator.lineTo(15, -47);
    this.statusIndicator.lineTo(20, -50);
    this.statusIndicator.lineTo(15, -53);
    this.statusIndicator.closePath();
    this.statusIndicator.endFill();
  }

  /**
   * Get accessory color from parent config
   */
  private getAccessoryColor(): number {
    return MENTOR_CONFIG.accessoryColor;
  }
}

export default MentorAgent;
