/**
 * AssistantAgent - CEO 助手
 *
 * The executive assistant with professional demeanor.
 * Primary color: Emerald green (efficiency, growth)
 * Accessory: Briefcase and earpiece
 */

import { Graphics } from 'pixi.js';
import { AgentSprite, AgentSpriteOptions } from './AgentSprite';

const ASSISTANT_CONFIG: Omit<AgentSpriteOptions, 'x' | 'y'> = {
  id: 'assistant',
  name: 'CEO 助手',
  role: 'Assistant',
  description: '协调资源和任务管理',
  primaryColor: 0x27AE60,      // Emerald green
  secondaryColor: 0x2ECC71,    // Light green
  accessoryColor: 0x34495E,    // Dark gray (professional)
};

export class AssistantAgent extends AgentSprite {
  private earpiece: Graphics;
  private briefcase: Graphics;
  private statusBadge: Graphics;

  constructor(x: number, y: number) {
    super({ ...ASSISTANT_CONFIG, x, y, scale: 1.0 });

    // Add assistant-specific features
    this.earpiece = this.createEarpiece();
    this.briefcase = this.createBriefcase();
    this.statusBadge = this.createStatusBadge();

    this.addChildAt(this.earpiece, this.getChildIndex(this.head) + 1);
    this.addChild(this.briefcase);
    this.addChild(this.statusBadge);
  }

  /**
   * Create a professional earpiece
   */
  private createEarpiece(): Graphics {
    const graphics = new Graphics();

    // Earpiece wire
    graphics.lineStyle(2, 0x2C3E50);
    graphics.arc(18, -20, 10, Math.PI * 0.5, Math.PI);

    // Earpiece bud
    graphics.beginFill(0x34495E);
    graphics.drawCircle(22, -25, 4);
    graphics.endFill();

    // Wire to collar
    graphics.lineStyle(1, 0x2C3E50);
    graphics.moveTo(18, -20);
    graphics.lineTo(12, 10);

    // Mic clip
    graphics.beginFill(0x2C3E50);
    graphics.drawRect(10, 8, 4, 4);
    graphics.endFill();

    return graphics;
  }

  /**
   * Create a professional briefcase
   */
  private createBriefcase(): Graphics {
    const graphics = new Graphics();

    // Briefcase body
    graphics.beginFill(0x2C3E50);
    graphics.drawRoundedRect(20, 35, 16, 20, 2);
    graphics.endFill();

    // Briefcase handle
    graphics.lineStyle(3, 0x34495E);
    graphics.moveTo(24, 33);
    graphics.lineTo(24, 28);
    graphics.lineTo(32, 28);
    graphics.lineTo(32, 33);

    // Briefcase clasp
    graphics.beginFill(0xF39C12);
    graphics.drawRect(27, 43, 4, 4);
    graphics.endFill();

    return graphics;
  }

  /**
   * Create a status/ID badge
   */
  private createStatusBadge(): Graphics {
    const graphics = new Graphics();

    // Badge clip
    graphics.beginFill(0x34495E);
    graphics.drawRect(12, 10, 6, 4);
    graphics.endFill();

    // Badge body
    graphics.beginFill(0xFFFFFF);
    graphics.drawRoundedRect(12, 14, 12, 16, 2);
    graphics.endFill();

    // Badge photo placeholder
    graphics.beginFill(0x27AE60);
    graphics.drawCircle(18, 19, 3);
    graphics.endFill();

    // Badge lines
    graphics.lineStyle(1, 0x333333);
    graphics.moveTo(14, 24);
    graphics.lineTo(22, 24);
    graphics.moveTo(14, 27);
    graphics.lineTo(22, 27);

    return graphics;
  }

  protected override createAccessory(color: number): Graphics {
    const graphics = new Graphics();

    // Professional suit
    graphics.beginFill(color);
    graphics.drawRect(-14, 5, 28, 45);
    graphics.endFill();

    // Suit lapels
    graphics.beginFill(0x1E8449);
    // Left lapel
    graphics.moveTo(-14, 5);
    graphics.lineTo(-4, 12);
    graphics.lineTo(-4, 28);
    graphics.lineTo(-14, 28);
    graphics.closePath();

    // Right lapel
    graphics.moveTo(14, 5);
    graphics.lineTo(4, 12);
    graphics.lineTo(4, 28);
    graphics.lineTo(14, 28);
    graphics.closePath();
    graphics.endFill();

    // White shirt
    graphics.beginFill(0xFFFFFF);
    graphics.drawRect(-4, 12, 8, 10);
    graphics.endFill();

    // Tie
    graphics.beginFill(0x27AE60);
    graphics.moveTo(0, 12);
    graphics.lineTo(-3, 20);
    graphics.lineTo(0, 28);
    graphics.lineTo(3, 20);
    graphics.closePath();
    graphics.endFill();

    // Belt
    graphics.lineStyle(3, 0x1C2833);
    graphics.moveTo(-14, 35);
    graphics.lineTo(14, 35);

    // Belt buckle
    graphics.beginFill(0xF39C12);
    graphics.drawRect(-3, 33, 6, 5);
    graphics.endFill();

    return graphics;
  }

  protected override createStatusIndicator(): Graphics {
    const graphics = new Graphics();
    graphics.visible = false;
    return graphics;
  }

  protected override drawThinkingIndicator(): void {
    super.drawThinkingIndicator();

    // Add checkmark/clipboard icon
    this.statusIndicator.beginFill(0x27AE60);
    this.statusIndicator.drawRoundedRect(16, -52, 8, 10, 2);
    this.statusIndicator.endFill();

    // Checkmark
    this.statusIndicator.lineStyle(2, 0xFFFFFF);
    this.statusIndicator.moveTo(18, -47);
    this.statusIndicator.lineTo(20, -45);
    this.statusIndicator.lineTo(23, -49);
  }

  protected override drawWorkingIndicator(): void {
    super.drawWorkingIndicator();

    // Add clock/time management icon
    this.statusIndicator.lineStyle(2, 0x27AE60);
    this.statusIndicator.drawCircle(20, -48, 7);

    // Clock hands
    this.statusIndicator.moveTo(20, -48);
    this.statusIndicator.lineTo(20, -43);
    this.statusIndicator.moveTo(20, -48);
    this.statusIndicator.lineTo(24, -48);
  }

  /**
   * Override to show badge when speaking
   */
  protected override drawSpeakingIndicator(): void {
    super.drawSpeakingIndicator();

    // Badge glow effect
    this.statusBadge.alpha = 1;
  }
}

export default AssistantAgent;
