/**
 * MarketerAgent - 运营推广师
 *
 * The marketing expert with promotional tools.
 * Primary color: Energetic pink/red (promotion, excitement)
 * Accessory: Megaphone and campaign materials
 */

import { Graphics } from 'pixi.js';
import { AgentSprite, AgentSpriteOptions } from './AgentSprite';

const MARKETER_CONFIG: Omit<AgentSpriteOptions, 'x' | 'y'> = {
  id: 'marketer',
  name: '运营推广师',
  role: 'Marketer',
  description: '负责市场推广和品牌建设',
  primaryColor: 0xE91E63,      // Energetic pink
  secondaryColor: 0xEC407A,    // Light pink
  accessoryColor: 0xFF5722,    // Deep orange (for megaphone)
};

export class MarketerAgent extends AgentSprite {
  private megaphone: Graphics;
  private clipboard: Graphics;
  private promotionStars: Graphics;

  constructor(x: number, y: number) {
    super({ ...MARKETER_CONFIG, x, y, scale: 1.0 });

    // Add marketer-specific features
    this.megaphone = this.createMegaphone();
    this.clipboard = this.createClipboard();
    this.promotionStars = this.createPromotionStars();

    this.addChild(this.megaphone);
    this.addChild(this.clipboard);
    this.addChild(this.promotionStars);

    // Animate stars
    this.animateStars();
  }

  /**
   * Get the accessory color for this agent
   */
  public getAccessoryColor(): number {
    return MARKETER_CONFIG.accessoryColor;
  }

  /**
   * Create a megaphone for promotion
   */
  private createMegaphone(): Graphics {
    const graphics = new Graphics();

    // Megaphone cone
    graphics.beginFill(this.getAccessoryColor());
    graphics.moveTo(25, 30);
    graphics.lineTo(40, 25);
    graphics.lineTo(40, 45);
    graphics.lineTo(25, 40);
    graphics.closePath();
    graphics.endFill();

    // Megaphone handle
    graphics.beginFill(0x333333);
    graphics.drawRect(22, 35, 6, 8);
    graphics.endFill();

    // Sound waves (decorative)
    graphics.lineStyle(2, this.getAccessoryColor(), 0.6);
    graphics.drawArc(42, 35, 8, -Math.PI * 0.3, Math.PI * 0.3);
    graphics.drawArc(42, 35, 12, -Math.PI * 0.2, Math.PI * 0.2);

    return graphics;
  }

  /**
   * Create a clipboard with campaign notes
   */
  private createClipboard(): Graphics {
    const graphics = new Graphics();

    // Clipboard base
    graphics.beginFill(0xD4AC6E);
    graphics.drawRoundedRect(-35, 25, 22, 30, 3);
    graphics.endFill();

    // Paper
    graphics.beginFill(0xFFFFFF);
    graphics.drawRect(-33, 27, 18, 26);
    graphics.endFill();

    // Checklist
    graphics.lineStyle(2, 0x2ECC71);
    // Check 1
    graphics.moveTo(-30, 33);
    graphics.lineTo(-28, 35);
    graphics.lineTo(-24, 31);

    // Lines
    graphics.lineStyle(1, 0x333333);
    graphics.moveTo(-30, 38);
    graphics.lineTo(-17, 38);
    graphics.moveTo(-30, 42);
    graphics.lineTo(-17, 42);
    graphics.moveTo(-30, 46);
    graphics.lineTo(-17, 46);
    graphics.moveTo(-30, 50);
    graphics.lineTo(-17, 50);

    return graphics;
  }

  /**
   * Create promotional star decorations
   */
  private createPromotionStars(): Graphics {
    const graphics = new Graphics();
    graphics.alpha = 0.8;

    // Draw multiple stars
    this.drawStar(graphics, 35, -30, 5, 0xF1C40F);
    this.drawStar(graphics, -38, -25, 4, 0xE74C3C);
    this.drawStar(graphics, 40, -10, 4, 0x9B59B6);
    this.drawStar(graphics, -35, 10, 5, 0x3498DB);

    return graphics;
  }

  /**
   * Helper to draw a star shape
   */
  private drawStar(
    graphics: Graphics,
    x: number,
    y: number,
    points: number,
    color: number
  ): void {
    const outerRadius = 6;
    const innerRadius = 3;

    graphics.beginFill(color);
    graphics.moveTo(x, y - outerRadius);

    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points;
      const starX = x + Math.sin(angle) * radius;
      const starY = y - Math.cos(angle) * radius;
      graphics.lineTo(starX, starY);
    }

    graphics.closePath();
    graphics.endFill();
  }

  private animateStars(): void {
    let frame = 0;
    const animate = (): void => {
      frame++;
      this.promotionStars.rotation = Math.sin(frame * 0.02) * 0.1;
      this.promotionStars.alpha = 0.6 + Math.sin(frame * 0.05) * 0.2;
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  protected override createAccessory(color: number): Graphics {
    const graphics = new Graphics();

    // Business jacket
    graphics.beginFill(color);
    graphics.drawRect(-15, 5, 30, 45);
    graphics.endFill();

    // Lapels
    graphics.beginFill(0xC2185B);
    graphics.moveTo(-15, 5);
    graphics.lineTo(-5, 15);
    graphics.lineTo(-5, 30);
    graphics.lineTo(-15, 30);
    graphics.closePath();

    graphics.moveTo(15, 5);
    graphics.lineTo(5, 15);
    graphics.lineTo(5, 30);
    graphics.lineTo(15, 30);
    graphics.closePath();
    graphics.endFill();

    // Name badge
    graphics.beginFill(0xFFFFFF);
    graphics.drawRect(8, 20, 10, 6);
    graphics.endFill();

    graphics.lineStyle(1, 0xE91E63);
    graphics.moveTo(10, 22);
    graphics.lineTo(16, 22);

    return graphics;
  }

  protected override drawSpeakingIndicator(): void {
    super.drawSpeakingIndicator();

    // Add bigger sound waves for marketer
    this.statusIndicator.lineStyle(3, 0xE91E63, 0.8);
    this.statusIndicator.drawArc(0, -40, 20, Math.PI * 0.1, Math.PI * 0.9);
  }
}

export default MarketerAgent;
