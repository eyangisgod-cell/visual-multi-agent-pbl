/**
 * SpeechBubble - PixiJS component for agent dialog display
 *
 * Renders speech bubbles above agent heads for communication.
 * Supports different bubble styles and animations.
 */

import {
  Container,
  Graphics,
  Text,
  TextStyle,
  Assets,
} from 'pixi.js';

export type BubblePosition = 'top' | 'left' | 'right' | 'bottom';

export interface SpeechBubbleOptions {
  text: string;
  position?: BubblePosition;
  maxWidth?: number;
  backgroundColor?: number;
  textColor?: number;
  fontSize?: number;
  showTail?: boolean;
  padding?: number;
  borderRadius?: number;
  animated?: boolean;
  duration?: number;
}

export class SpeechBubble extends Container {
  public bubble: Graphics;
  public textField: Text;
  public tail: Graphics;

  private options: Required<SpeechBubbleOptions>;
  private isVisible: boolean = false;
  private closeTimer?: NodeJS.Timeout;

  constructor(options: SpeechBubbleOptions) {
    super();

    this.options = {
      text: options.text,
      position: options.position ?? 'top',
      maxWidth: options.maxWidth ?? 200,
      backgroundColor: options.backgroundColor ?? 0xFFFFFF,
      textColor: options.textColor ?? 0x333333,
      fontSize: options.fontSize ?? 14,
      showTail: options.showTail ?? true,
      padding: options.padding ?? 12,
      borderRadius: options.borderRadius ?? 8,
      animated: options.animated ?? true,
      duration: options.duration ?? 3000,
    };

    this.bubble = new Graphics();
    this.tail = new Graphics();
    this.textField = this.createTextField();

    this.addChild(this.bubble);
    this.addChild(this.tail);
    this.addChild(this.textField);

    this.updateContent();
  }

  /**
   * Create text field with word wrapping
   */
  private createTextField(): Text {
    const style = new TextStyle({
      fontSize: this.options.fontSize,
      fontWeight: 'normal',
      fill: this.options.textColor,
      wordWrap: true,
      wordWrapWidth: this.options.maxWidth - this.options.padding * 2,
      align: 'left',
      breakWords: true,
    });

    const text = new Text(this.options.text, style);
    text.anchor.set(0, 0);

    return text;
  }

  /**
   * Update bubble content and redraw
   */
  public updateContent(text?: string): void {
    if (text !== undefined) {
      this.options.text = text;
      this.textField.text = text;
    }

    // Calculate bubble size based on text
    const textBounds = this.textField.getBounds();
    const bubbleWidth = Math.min(
      textBounds.width + this.options.padding * 2,
      this.options.maxWidth
    );
    const bubbleHeight = textBounds.height + this.options.padding * 2;

    // Update text position
    this.textField.x = this.options.padding;
    this.textField.y = this.options.padding;

    // Draw bubble
    this.drawBubble(bubbleWidth, bubbleHeight);

    // Draw tail
    if (this.options.showTail) {
      this.drawTail(bubbleWidth, bubbleHeight);
    }
  }

  /**
   * Draw the main bubble body
   */
  private drawBubble(width: number, height: number): void {
    this.bubble.clear();

    const { backgroundColor, borderRadius } = this.options;

    // Main bubble background
    this.bubble.beginFill(backgroundColor, 0.95);
    this.bubble.lineStyle(2, 0x333333, 0.5);
    this.bubble.drawRoundedRect(0, 0, width, height, borderRadius);
    this.bubble.endFill();

    // Subtle gradient overlay
    this.bubble.beginFill(0xFFFFFF, 0.1);
    this.bubble.drawRoundedRect(4, 4, width - 8, height / 3, borderRadius / 2);
    this.bubble.endFill();
  }

  /**
   * Draw the tail pointing to the agent
   */
  private drawTail(bubbleWidth: number, bubbleHeight: number): void {
    this.tail.clear();

    const tailSize = 10;
    const tailColor = this.options.backgroundColor;

    this.tail.beginFill(tailColor, 0.95);
    this.tail.lineStyle(2, 0x333333, 0.5);

    switch (this.options.position) {
      case 'top':
        // Tail pointing down
        this.tail.moveTo(bubbleWidth / 2 - tailSize / 2, bubbleHeight);
        this.tail.lineTo(bubbleWidth / 2, bubbleHeight + tailSize);
        this.tail.lineTo(bubbleWidth / 2 + tailSize / 2, bubbleHeight);
        break;

      case 'bottom':
        // Tail pointing up
        this.tail.moveTo(bubbleWidth / 2 - tailSize / 2, 0);
        this.tail.lineTo(bubbleWidth / 2, -tailSize);
        this.tail.lineTo(bubbleWidth / 2 + tailSize / 2, 0);
        break;

      case 'left':
        // Tail pointing left
        this.tail.moveTo(bubbleWidth, bubbleHeight / 2 - tailSize / 2);
        this.tail.lineTo(bubbleWidth + tailSize, bubbleHeight / 2);
        this.tail.lineTo(bubbleWidth, bubbleHeight / 2 + tailSize / 2);
        break;

      case 'right':
        // Tail pointing right
        this.tail.moveTo(0, bubbleHeight / 2 - tailSize / 2);
        this.tail.lineTo(-tailSize, bubbleHeight / 2);
        this.tail.lineTo(0, bubbleHeight / 2 + tailSize / 2);
        break;
    }

    this.tail.closePath();
    this.tail.endFill();

    // Position tail based on bubble position
    this.positionTail(bubbleWidth, bubbleHeight);
  }

  /**
   * Position the tail based on bubble orientation
   */
  private positionTail(bubbleWidth: number, bubbleHeight: number): void {
    switch (this.options.position) {
      case 'top':
        this.tail.x = 0;
        this.tail.y = 0;
        break;
      case 'bottom':
        this.tail.x = 0;
        this.tail.y = bubbleHeight;
        break;
      case 'left':
        this.tail.x = -bubbleWidth;
        this.tail.y = 0;
        break;
      case 'right':
        this.tail.x = bubbleWidth;
        this.tail.y = 0;
        break;
    }
  }

  /**
   * Show the speech bubble with optional animation
   */
  public show(duration?: number): void {
    if (this.options.animated) {
      this.animateIn();
    } else {
      this.visible = true;
      this.isVisible = true;
    }

    if (duration !== undefined) {
      this.options.duration = duration;
    }

    // Auto-hide after duration
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
    }

    if (this.options.duration > 0) {
      this.closeTimer = setTimeout(() => {
        this.hide();
      }, this.options.duration);
    }
  }

  /**
   * Hide the speech bubble with animation
   */
  public hide(): void {
    if (this.options.animated) {
      this.animateOut();
    } else {
      this.visible = false;
      this.isVisible = false;
    }

    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = undefined;
    }
  }

  /**
   * Animate bubble appearing
   */
  private animateIn(): void {
    this.visible = true;
    this.scale.set(0);
    this.alpha = 0;

    const startTime = Date.now();
    const duration = 300;

    const animate = (): void => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Elastic ease out
      const eased = this.easeOutElastic(progress);

      this.scale.set(eased);
      this.alpha = eased;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isVisible = true;
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Animate bubble disappearing
   */
  private animateOut(): void {
    const startTime = Date.now();
    const duration = 200;

    const animate = (): void => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const eased = 1 - progress;

      this.scale.set(eased);
      this.alpha = eased;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.visible = false;
        this.isVisible = false;
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Elastic ease out function
   */
  private easeOutElastic(x: number): number {
    if (x === 0 || x === 1) return x;

    const c4 = (2 * Math.PI) / 3;

    return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
  }

  /**
   * Check if bubble is currently visible
   */
  public getIsVisible(): boolean {
    return this.isVisible;
  }

  /**
   * Update bubble text without redrawing
   */
  public setText(text: string): void {
    this.updateContent(text);
  }

  /**
   * Get bubble dimensions
   */
  public getDimensions(): { width: number; height: number } {
    const bounds = this.getBounds();
    return {
      width: bounds.width,
      height: bounds.height,
    };
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
    }
    super.destroy({ children: true });
  }
}

export default SpeechBubble;
