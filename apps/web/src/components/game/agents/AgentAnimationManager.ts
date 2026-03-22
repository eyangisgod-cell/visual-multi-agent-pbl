/**
 * Agent Animation System
 *
 * Provides advanced animation capabilities for agent sprites including:
 * - Status-based animations
 * - Emotion expressions
 * - Particle effects
 * - Transition animations
 */

import { AgentSprite, AgentStatus } from './AgentSprite';
import { Container, Graphics, Texture, Sprite, Filter } from 'pixi.js';

export interface AnimationConfig {
  duration: number;
  easing: EasingFunction;
  loop?: boolean;
  yoyo?: boolean;
}

export type EasingFunction =
  | 'linear'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInOutQuad'
  | 'easeInBounce'
  | 'easeOutBounce'
  | 'easeInOutBounce'
  | 'easeInElastic'
  | 'easeOutElastic';

export interface EmotionState {
  happy: boolean;
  surprised: boolean;
  focused: boolean;
  tired: boolean;
}

/**
 * Animation manager for agent sprites
 */
export class AgentAnimationManager {
  private agent: AgentSprite;
  private container: Container;
  private effects: Container;
  private activeAnimations: Map<string, AnimationHandle> = new Map();

  constructor(agent: AgentSprite, container: Container) {
    this.agent = agent;
    this.container = container;
    this.effects = new Container();
    container.addChild(this.effects);
  }

  /**
   * Play a status-based animation
   */
  public playStatusAnimation(status: AgentStatus): void {
    this.stopAllAnimations();

    switch (status) {
      case 'thinking':
        this.playThinkingAnimation();
        break;
      case 'speaking':
        this.playSpeakingAnimation();
        break;
      case 'working':
        this.playWorkingAnimation();
        break;
      case 'idle':
        this.playIdleAnimation();
        break;
    }
  }

  /**
   * Thinking animation - floating particles and head bob
   */
  private playThinkingAnimation(): void {
    // Create thought bubbles
    const createBubble = (): void => {
      if (this.agent.getStatus() !== 'thinking') return;

      const bubble = this.createThoughtBubble();
      this.effects.addChild(bubble);

      // Animate bubble floating up
      this.animatePosition(bubble, {
        startY: this.agent.y - 60,
        endY: this.agent.y - 120,
        startX: this.agent.x + 20,
        endX: this.agent.x + 20 + Math.random() * 20 - 10,
        duration: 2000,
        easing: 'easeOutQuad',
        onComplete: () => {
          this.effects.removeChild(bubble);
        },
      });

      // Schedule next bubble
      setTimeout(createBubble, 800 + Math.random() * 600);
    };

    createBubble();
  }

  /**
   * Speaking animation - mouth movement and sound waves
   */
  private playSpeakingAnimation(): void {
    // Create sound wave pulses
    const createWave = (): void => {
      if (this.agent.getStatus() !== 'speaking') return;

      const wave = this.createSoundWave();
      this.effects.addChild(wave);

      // Animate wave expanding
      let scale = 1;
      const animateWave = (): void => {
        scale += 0.1;
        wave.scale.set(scale);
        wave.alpha = 1 - scale / 10;

        if (scale < 8 && this.agent.getStatus() === 'speaking') {
          requestAnimationFrame(animateWave);
        } else {
          this.effects.removeChild(wave);
        }
      };

      requestAnimationFrame(animateWave);

      // Schedule next wave
      setTimeout(createWave, 300);
    };

    createWave();
  }

  /**
   * Working animation - tool movement and progress indicators
   */
  private playWorkingAnimation(): void {
    // Create progress particles
    const createParticle = (): void => {
      if (this.agent.getStatus() !== 'working') return;

      const particle = this.createWorkParticle();
      this.effects.addChild(particle);

      const startX = this.agent.x + (Math.random() > 0.5 ? 30 : -30);
      const endX = this.agent.x;

      this.animatePosition(particle, {
        startY: this.agent.y + 30,
        endY: this.agent.y - 20,
        startX,
        endX,
        duration: 1000,
        easing: 'easeInOutQuad',
        onComplete: () => {
          this.effects.removeChild(particle);
        },
      });

      setTimeout(createParticle, 200 + Math.random() * 300);
    };

    createParticle();
  }

  /**
   * Idle animation - gentle breathing
   */
  private playIdleAnimation(): void {
    // Subtle scale animation for breathing effect
    const breathe = (): void => {
      if (this.agent.getStatus() !== 'idle') return;

      const startTime = Date.now();
      const duration = 1500;

      const animateBreath = (): void => {
        if (this.agent.getStatus() !== 'idle') return;

        const elapsed = Date.now() - startTime;
        const progress = (elapsed % duration) / duration;
        const scale = 1 + Math.sin(progress * Math.PI * 2) * 0.02;

        this.agent.scale.set(scale);

        requestAnimationFrame(animateBreath);
      };

      requestAnimationFrame(animateBreath);
    };

    breathe();
  }

  /**
   * Create a thought bubble graphic
   */
  private createThoughtBubble(): Graphics {
    const graphics = new Graphics();
    const size = 8 + Math.random() * 8;

    graphics.beginFill(0x9B59B6, 0.6);
    graphics.drawCircle(0, 0, size);
    graphics.endFill();

    graphics.beginFill(0xFFFFFF, 0.3);
    graphics.drawCircle(-size * 0.3, -size * 0.3, size * 0.3);
    graphics.endFill();

    return graphics;
  }

  /**
   * Create a sound wave graphic
   */
  private createSoundWave(): Container {
    const container = new Container();
    const waves = 3;

    for (let i = 0; i < waves; i++) {
      const graphics = new Graphics();
      graphics.lineStyle(2 - i * 0.5, 0x3498DB, 0.8 - i * 0.2);
      graphics.drawArc(0, 0, 15 + i * 8, Math.PI * 0.3, Math.PI * 0.7);
      container.addChild(graphics);
    }

    container.x = this.agent.x;
    container.y = this.agent.y - 40;

    return container;
  }

  /**
   * Create a work particle graphic
   */
  private createWorkParticle(): Graphics {
    const graphics = new Graphics();
    const colors = [0x2ECC71, 0x3498DB, 0xF39C12];
    const color = colors[Math.floor(Math.random() * colors.length)];

    graphics.beginFill(color);
    graphics.drawRect(0, 0, 6, 6);
    graphics.endFill();

    return graphics;
  }

  /**
   * Animate position with easing
   */
  private animatePosition(
    target: Container & { y: number; x: number },
    config: {
      startY: number;
      endY: number;
      startX: number;
      endX: number;
      duration: number;
      easing: EasingFunction;
      onComplete?: () => void;
    }
  ): void {
    const startTime = Date.now();
    const { startY, endY, startX, endX, duration, easing, onComplete } = config;

    const animate = (): void => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easedProgress = this.applyEasing(progress, easing);

      target.x = startX + (endX - startX) * easedProgress;
      target.y = startY + (endY - startY) * easedProgress;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete?.();
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Apply easing function to progress value
   */
  private applyEasing(progress: number, easing: EasingFunction): number {
    switch (easing) {
      case 'linear':
        return progress;
      case 'easeInQuad':
        return progress * progress;
      case 'easeOutQuad':
        return progress * (2 - progress);
      case 'easeInOutQuad':
        return progress < 0.5
          ? 2 * progress * progress
          : -1 + (4 - 2 * progress) * progress;
      case 'easeOutBounce':
        return this.easeOutBounce(progress);
      case 'easeInBounce':
        return 1 - this.easeOutBounce(1 - progress);
      default:
        return progress;
    }
  }

  private easeOutBounce(x: number): number {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (x < 1 / d1) {
      return n1 * x * x;
    } else if (x < 2 / d1) {
      return n1 * (x -= 1.5 / d1) * x + 0.75;
    } else if (x < 2.5 / d1) {
      return n1 * (x -= 2.25 / d1) * x + 0.9375;
    } else {
      return n1 * (x -= 2.625 / d1) * x + 0.984375;
    }
  }

  /**
   * Stop all active animations
   */
  public stopAllAnimations(): void {
    // Clear effects container
    this.effects.removeChildren().forEach((child) => child.destroy());
  }

  /**
   * Play a custom animation
   */
  public playAnimation(
    name: string,
    config: AnimationConfig,
    onFrame: (progress: number) => void,
    onComplete?: () => void
  ): void {
    const startTime = Date.now();
    let currentProgress = 0;
    let direction = 1;

    const animate = (): void => {
      const elapsed = Date.now() - startTime;
      let progress = elapsed / config.duration;

      if (config.yoyo && progress > 1) {
        direction = -1;
        progress = 2 - progress;
      }

      if (progress > 1 && !config.yoyo) {
        progress = config.loop ? 0 : 1;
      }

      if (progress < 0 && config.yoyo) {
        onComplete?.();
        if (config.loop) {
          this.playAnimation(name, config, onFrame, onComplete);
        }
        return;
      }

      currentProgress = progress;
      const easedProgress = this.applyEasing(progress, config.easing);
      onFrame(easedProgress);

      if (progress < 1 || config.loop) {
        this.activeAnimations.set(name, { cancel: () => {} });
        requestAnimationFrame(animate);
      } else {
        this.activeAnimations.delete(name);
        onComplete?.();
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Flash effect for emphasis
   */
  public flash(color: number = 0xFFFFFF, duration: number = 200): void {
    const flash = new Graphics();
    flash.beginFill(color, 0.8);
    flash.drawRect(-50, -80, 100, 160);
    flash.endFill();

    this.effects.addChild(flash);

    setTimeout(() => {
      this.effects.removeChild(flash);
      flash.destroy();
    }, duration);
  }

  /**
   * Shake effect for error or excitement
   */
  public shake(intensity: number = 5, duration: number = 300): void {
    const startTime = Date.now();
    const originalX = this.agent.x;
    const originalY = this.agent.y;

    const shake = (): void => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress < 1) {
        const remaining = 1 - progress;
        this.agent.x =
          originalX + (Math.random() - 0.5) * intensity * remaining * 2;
        this.agent.y =
          originalY + (Math.random() - 0.5) * intensity * remaining * 2;
        requestAnimationFrame(shake);
      } else {
        this.agent.x = originalX;
        this.agent.y = originalY;
      }
    };

    shake();
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stopAllAnimations();
    this.container.removeChild(this.effects);
    this.effects.destroy();
  }
}

interface AnimationHandle {
  cancel: () => void;
}

export default AgentAnimationManager;
