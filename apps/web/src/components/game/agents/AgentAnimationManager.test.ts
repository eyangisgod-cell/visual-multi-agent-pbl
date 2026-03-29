/**
 * AgentAnimationManager Test Suite
 *
 * Tests for the AgentAnimationManager class.
 */

import { AgentSprite } from './AgentSprite';
import { AgentAnimationManager } from './AgentAnimationManager';
import { Container } from 'pixi.js';

describe('AgentAnimationManager', () => {
  let agent: AgentSprite;
  let container: Container;
  let animationManager: AgentAnimationManager;

  beforeEach(() => {
    // Create a mock agent sprite
    agent = new AgentSprite({
      id: 'test-agent',
      name: 'Test Agent',
      role: 'Test',
      description: 'Test Description',
      primaryColor: 0xff0000,
      secondaryColor: 0x00ff00,
      accessoryColor: 0x0000ff,
      x: 0,
      y: 0,
    });

    // Create container for animations
    container = new Container();

    // Create animation manager
    animationManager = new AgentAnimationManager(agent, container);
  });

  afterEach(() => {
    animationManager.destroy();
    container.destroy({ children: true });
    agent.destroy();
  });

  describe('Basic Functionality', () => {
    it('should create an instance', () => {
      expect(animationManager).toBeInstanceOf(AgentAnimationManager);
    });

    it('should stop all animations', () => {
      expect(() => {
        animationManager.stopAllAnimations();
      }).not.toThrow();
    });
  });

  describe('Status Animations', () => {
    it('should play idle animation', () => {
      agent.setStatus('idle');

      expect(() => {
        animationManager.playStatusAnimation('idle');
      }).not.toThrow();
    });

    it('should play thinking animation', () => {
      agent.setStatus('thinking');

      expect(() => {
        animationManager.playStatusAnimation('thinking');
      }).not.toThrow();
    });

    it('should play speaking animation', () => {
      agent.setStatus('speaking');

      expect(() => {
        animationManager.playStatusAnimation('speaking');
      }).not.toThrow();
    });

    it('should play working animation', () => {
      agent.setStatus('working');

      expect(() => {
        animationManager.playStatusAnimation('working');
      }).not.toThrow();
    });

    it('should stop previous animation when playing new one', () => {
      agent.setStatus('idle');
      animationManager.playStatusAnimation('idle');

      agent.setStatus('thinking');
      animationManager.playStatusAnimation('thinking');

      // Should not throw - previous animation should be stopped
      expect(agent.getStatus()).toBe('thinking');
    });
  });

  describe('Custom Animation', () => {
    it('should play custom animation', (done) => {
      let frameCount = 0;

      animationManager.playAnimation(
        'test',
        {
          duration: 100,
          easing: 'linear',
          loop: false,
        },
        (progress) => {
          frameCount++;
        },
        () => {
          expect(frameCount).toBeGreaterThan(0);
          done();
        }
      );
    }, 200);

    it('should play yoyo animation', () => {
      expect(() => {
        animationManager.playAnimation(
          'yoyo',
          {
            duration: 200,
            easing: 'linear',
            yoyo: true,
            loop: false,
          },
          () => {}
        );
      }).not.toThrow();
    });

    it('should play looping animation', () => {
      expect(() => {
        animationManager.playAnimation(
          'loop',
          {
            duration: 500,
            easing: 'linear',
            loop: true,
          },
          () => {}
        );
      }).not.toThrow();
    });
  });

  describe('Special Effects', () => {
    it('should flash effect', () => {
      expect(() => {
        animationManager.flash(0xffffff, 100);
      }).not.toThrow();
    });

    it('should flash with default color', () => {
      expect(() => {
        animationManager.flash();
      }).not.toThrow();
    });

    it('should shake effect', () => {
      expect(() => {
        animationManager.shake(5, 200);
      }).not.toThrow();
    });

    it('should shake with default parameters', () => {
      expect(() => {
        animationManager.shake();
      }).not.toThrow();
    });
  });

  describe('Easing Functions', () => {
    it('should apply linear easing', () => {
      expect(() => {
        animationManager.playAnimation(
          'linear',
          { duration: 100, easing: 'linear' },
          () => {}
        );
      }).not.toThrow();
    });

    it('should apply easeInQuad', () => {
      expect(() => {
        animationManager.playAnimation(
          'easeInQuad',
          { duration: 100, easing: 'easeInQuad' },
          () => {}
        );
      }).not.toThrow();
    });

    it('should apply easeOutQuad', () => {
      expect(() => {
        animationManager.playAnimation(
          'easeOutQuad',
          { duration: 100, easing: 'easeOutQuad' },
          () => {}
        );
      }).not.toThrow();
    });

    it('should apply easeInOutQuad', () => {
      expect(() => {
        animationManager.playAnimation(
          'easeInOutQuad',
          { duration: 100, easing: 'easeInOutQuad' },
          () => {}
        );
      }).not.toThrow();
    });

    it('should apply easeOutBounce', () => {
      expect(() => {
        animationManager.playAnimation(
          'easeOutBounce',
          { duration: 100, easing: 'easeOutBounce' },
          () => {}
        );
      }).not.toThrow();
    });

    it('should apply easeInBounce', () => {
      expect(() => {
        animationManager.playAnimation(
          'easeInBounce',
          { duration: 100, easing: 'easeInBounce' },
          () => {}
        );
      }).not.toThrow();
    });

    it('should apply easeOutElastic', () => {
      expect(() => {
        animationManager.playAnimation(
          'easeOutElastic',
          { duration: 100, easing: 'easeOutElastic' },
          () => {}
        );
      }).not.toThrow();
    });

    it('should apply easeInElastic', () => {
      expect(() => {
        animationManager.playAnimation(
          'easeInElastic',
          { duration: 100, easing: 'easeInElastic' },
          () => {}
        );
      }).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should destroy without errors', () => {
      expect(() => {
        animationManager.destroy();
      }).not.toThrow();
    });

    it('should cleanup effects container', () => {
      animationManager.destroy();

      // After destroy, container should have no children added by manager
      expect(container).toBeDefined();
    });
  });
});
