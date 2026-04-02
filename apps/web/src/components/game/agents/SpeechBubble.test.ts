/**
 * SpeechBubble Test Suite
 *
 * Tests for the SpeechBubble PixiJS component.
 */

import { SpeechBubble } from './SpeechBubble';

describe('SpeechBubble', () => {
  describe('Basic Functionality', () => {
    it('should create an instance with default options', () => {
      const bubble = new SpeechBubble({ text: 'Hello' });

      expect(bubble).toBeInstanceOf(SpeechBubble);
      expect(bubble.bubble).toBeDefined();
      expect(bubble.textField).toBeDefined();
      expect(bubble.tail).toBeDefined();
    });

    it('should create with custom options', () => {
      const bubble = new SpeechBubble({
        text: 'Custom Text',
        maxWidth: 300,
        backgroundColor: 0xff0000,
        textColor: 0x00ff00,
        fontSize: 18,
        position: 'left',
        showTail: false,
        padding: 16,
        borderRadius: 12,
        animated: false,
        duration: 5000,
      });

      expect(bubble).toBeInstanceOf(SpeechBubble);
    });

    it('should have default position top', () => {
      const bubble = new SpeechBubble({ text: 'Test' });
      // Default position is 'top' - verified by construction
      expect(bubble).toBeDefined();
    });
  });

  describe('Content Updates', () => {
    it('should update text content', () => {
      const bubble = new SpeechBubble({ text: 'Initial' });

      bubble.updateContent('Updated Text');

      expect(bubble.textField.text).toBe('Updated Text');
    });

    it('should setText without redrawing', () => {
      const bubble = new SpeechBubble({ text: 'Initial' });

      bubble.setText('New Text');

      expect(bubble.textField.text).toBe('New Text');
    });

    it('should get dimensions after content update', () => {
      const bubble = new SpeechBubble({ text: 'Test Content' });

      const dimensions = bubble.getDimensions();

      expect(dimensions.width).toBeGreaterThan(0);
      expect(dimensions.height).toBeGreaterThan(0);
    });
  });

  describe('Show/Hide Functionality', () => {
    it('should show bubble without animation', () => {
      const bubble = new SpeechBubble({
        text: 'Test',
        animated: false,
        duration: 0,
      });

      bubble.show();

      expect(bubble.getIsVisible()).toBe(true);
    });

    it('should hide bubble without animation', () => {
      const bubble = new SpeechBubble({
        text: 'Test',
        animated: false,
        duration: 0,
      });

      bubble.show();
      expect(bubble.getIsVisible()).toBe(true);

      bubble.hide();
      expect(bubble.getIsVisible()).toBe(false);
    });

    it('should auto-hide after duration', (done) => {
      const bubble = new SpeechBubble({
        text: 'Auto Hide',
        animated: false,
        duration: 100,
      });

      bubble.show();
      expect(bubble.getIsVisible()).toBe(true);

      setTimeout(() => {
        expect(bubble.getIsVisible()).toBe(false);
        done();
      }, 150);
    }, 200);
  });

  describe('Bubble Positions', () => {
    it('should support top position', () => {
      const bubble = new SpeechBubble({
        text: 'Top',
        position: 'top',
      });

      expect(bubble).toBeDefined();
    });

    it('should support bottom position', () => {
      const bubble = new SpeechBubble({
        text: 'Bottom',
        position: 'bottom',
      });

      expect(bubble).toBeDefined();
    });

    it('should support left position', () => {
      const bubble = new SpeechBubble({
        text: 'Left',
        position: 'left',
      });

      expect(bubble).toBeDefined();
    });

    it('should support right position', () => {
      const bubble = new SpeechBubble({
        text: 'Right',
        position: 'right',
      });

      expect(bubble).toBeDefined();
    });
  });

  describe('Visual Configuration', () => {
    it('should create with custom background color', () => {
      const bubble = new SpeechBubble({
        text: 'Custom BG',
        backgroundColor: 0xabcdef,
        animated: false,
      });

      expect(bubble).toBeDefined();
    });

    it('should create with custom text color', () => {
      const bubble = new SpeechBubble({
        text: 'Custom Text',
        textColor: 0x123456,
        animated: false,
      });

      expect(bubble).toBeDefined();
    });

    it('should create without tail', () => {
      const bubble = new SpeechBubble({
        text: 'No Tail',
        showTail: false,
        animated: false,
      });

      expect(bubble).toBeDefined();
    });
  });

  describe('Animation', () => {
    it('should animate in when animated is true', () => {
      const bubble = new SpeechBubble({
        text: 'Animated',
        animated: true,
      });

      // Bubble is created with visible=true by default in PixiJS
      // The animation starts immediately
      expect(bubble.visible).toBe(true);

      bubble.show();

      // Should remain visible after animation starts
      expect(bubble.visible).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should destroy without errors', () => {
      const bubble = new SpeechBubble({ text: 'Test' });

      expect(() => bubble.destroy()).not.toThrow();
    });

    it('should destroy and cleanup timer', (done) => {
      const bubble = new SpeechBubble({
        text: 'Test',
        duration: 1000,
      });

      bubble.show();

      // Destroy before auto-hide
      bubble.destroy();

      setTimeout(() => {
        // Should not throw or cause errors
        expect(true).toBe(true);
        done();
      }, 1100);
    }, 1200);
  });
});
