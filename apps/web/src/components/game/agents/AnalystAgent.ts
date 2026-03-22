/**
 * AnalystAgent - 数据分析师
 *
 * The analytical expert with tech accessories.
 * Primary color: Cool blue (logic, data)
 * Accessory: Headset and tablet
 */

import { Graphics } from 'pixi.js';
import { AgentSprite, AgentSpriteOptions } from './AgentSprite';

const ANALYST_CONFIG: Omit<AgentSpriteOptions, 'x' | 'y'> = {
  id: 'analyst',
  name: '数据分析师',
  role: 'Analyst',
  description: '负责数据处理和分析洞察',
  primaryColor: 0x3498DB,      // Cool blue
  secondaryColor: 0x5DADE2,    // Light blue
  accessoryColor: 0x1ABC9C,    // Teal (for tech)
};

export class AnalystAgent extends AgentSprite {
  private headset: Graphics;
  private tablet: Graphics;
  private dataParticles: Graphics;

  constructor(x: number, y: number) {
    super({ ...ANALYST_CONFIG, x, y, scale: 1.0 });

    // Add analyst-specific features
    this.headset = this.createHeadset();
    this.tablet = this.createTablet();
    this.dataParticles = this.createDataParticles();

    // Add headset on top of head
    this.addChildAt(this.headset, this.getChildIndex(this.head) + 1);
    this.addChild(this.tablet);
    this.addChild(this.dataParticles);

    // Data particles animation
    this.animateDataParticles();
  }

  /**
   * Create a tech headset
   */
  private createHeadset(): Graphics {
    const graphics = new Graphics();

    // Headband
    graphics.lineStyle(4, 0x2C3E50);
    graphics.drawArc(0, -40, 25, Math.PI, 0);

    // Left ear cup
    graphics.beginFill(0x34495E);
    graphics.drawRoundedRect(-28, -35, 8, 14, 3);
    graphics.endFill();

    // Right ear cup
    graphics.beginFill(0x34495E);
    graphics.drawRoundedRect(20, -35, 8, 14, 3);
    graphics.endFill();

    // Microphone boom
    graphics.lineStyle(2, 0x2C3E50);
    graphics.drawArc(-25, -25, 8, 0, Math.PI * 0.5);

    // Mic
    graphics.beginFill(0x1ABC9C);
    graphics.drawCircle(-25, -17, 3);
    graphics.endFill();

    return graphics;
  }

  /**
   * Create a data tablet
   */
  private createTablet(): Graphics {
    const graphics = new Graphics();

    // Tablet body
    graphics.beginFill(0x2C3E50);
    graphics.drawRoundedRect(15, 25, 20, 28, 3);
    graphics.endFill();

    // Screen
    graphics.beginFill(0x1ABC9C);
    graphics.drawRoundedRect(17, 27, 16, 24, 2);
    graphics.endFill();

    // Chart lines on screen
    graphics.lineStyle(1, 0xFFFFFF, 0.8);
    graphics.moveTo(19, 45);
    graphics.lineTo(23, 38);
    graphics.lineTo(27, 42);
    graphics.lineTo(31, 32);

    // Data dots
    graphics.beginFill(0xFFFFFF);
    graphics.drawCircle(23, 38, 2);
    graphics.drawCircle(27, 42, 2);
    graphics.drawCircle(31, 32, 2);
    graphics.endFill();

    return graphics;
  }

  /**
   * Create floating data particles
   */
  private createDataParticles(): Graphics {
    const graphics = new Graphics();
    graphics.alpha = 0.6;

    // Binary-style particles
    graphics.beginFill(0x1ABC9C, 0.8);
    graphics.drawRect(35, -20, 4, 6);
    graphics.drawRect(38, -10, 4, 6);
    graphics.drawRect(35, 0, 4, 6);
    graphics.endFill();

    graphics.beginFill(0x3498DB, 0.8);
    graphics.drawRect(-40, -15, 4, 6);
    graphics.drawRect(-37, -5, 4, 6);
    graphics.drawRect(-40, 5, 4, 6);
    graphics.endFill();

    return graphics;
  }

  private animateDataParticles(): void {
    let frame = 0;
    const animate = (): void => {
      frame++;
      const offset = Math.sin(frame * 0.05) * 3;
      this.dataParticles.y = offset;
      this.dataParticles.alpha = 0.4 + Math.sin(frame * 0.1) * 0.2;
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  protected override createAccessory(color: number): Graphics {
    const graphics = new Graphics();

    // Tech vest
    graphics.beginFill(color);
    graphics.drawRect(-12, 5, 24, 40);
    graphics.endFill();

    // Zipper detail
    graphics.lineStyle(2, 0x34495E);
    graphics.moveTo(0, 10);
    graphics.lineTo(0, 40);

    // Pocket with pen
    graphics.beginFill(0x2C3E50);
    graphics.drawRect(-8, 20, 10, 8);
    graphics.endFill();

    graphics.lineStyle(2, 0xF39C12);
    graphics.moveTo(-3, 20);
    graphics.lineTo(-3, 14);

    return graphics;
  }

  protected override drawThinkingIndicator(): void {
    super.drawThinkingIndicator();

    // Add gear/cog icon (processing)
    this.statusIndicator.lineStyle(2, 0x1ABC9C);
    this.statusIndicator.drawCircle(20, -48, 6);

    // Gear teeth
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = 20 + Math.cos(angle) * 8;
      const y = -48 + Math.sin(angle) * 8;
      this.statusIndicator.beginPath();
      this.statusIndicator.arc(x, y, 2, 0, Math.PI * 2);
      this.statusIndicator.endFill();
      this.statusIndicator.beginFill(0x1ABC9C);
      this.statusIndicator.drawCircle(x, y, 2);
      this.statusIndicator.endFill();
    }
  }

  protected override drawWorkingIndicator(): void {
    super.drawWorkingIndicator();

    // Add bar chart
    this.statusIndicator.beginFill(0x3498DB);
    this.statusIndicator.drawRect(17, -52, 2, 4);
    this.statusIndicator.drawRect(20, -50, 2, 6);
    this.statusIndicator.drawRect(23, -48, 2, 8);
    this.statusIndicator.endFill();
  }
}

export default AnalystAgent;
