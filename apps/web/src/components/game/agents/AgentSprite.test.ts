/**
 * AgentSprite Test Suite
 *
 * Tests for the base AgentSprite class and agent type implementations.
 */

import { AgentSprite } from './AgentSprite';
import { MentorAgent } from './MentorAgent';
import { DesignerAgent } from './DesignerAgent';
import { AnalystAgent } from './AnalystAgent';
import { MarketerAgent } from './MarketerAgent';
import { AssistantAgent } from './AssistantAgent';

describe('AgentSprite', () => {
  describe('Base AgentSprite Class', () => {
    it('should create an instance with required properties', () => {
      const sprite = new AgentSprite({
        id: 'test-agent',
        name: 'Test Agent',
        role: 'Tester',
        description: 'A test agent',
        primaryColor: 0xff0000,
        secondaryColor: 0x00ff00,
        accessoryColor: 0x0000ff,
        x: 100,
        y: 200,
      });

      expect(sprite.id).toBe('test-agent');
      expect(sprite.name).toBe('Test Agent');
      expect(sprite.role).toBe('Tester');
      expect(sprite.description).toBe('A test agent');
      expect(sprite.x).toBe(100);
      expect(sprite.y).toBe(200);
    });

    it('should initialize with idle status', () => {
      const sprite = new AgentSprite({
        id: 'test',
        name: 'Test',
        role: 'Test',
        description: 'Test',
        primaryColor: 0xffffff,
        secondaryColor: 0x000000,
        accessoryColor: 0x888888,
        x: 0,
        y: 0,
      });

      expect(sprite.getStatus()).toBe('idle');
    });

    it('should update status correctly', () => {
      const sprite = new AgentSprite({
        id: 'test',
        name: 'Test',
        role: 'Test',
        description: 'Test',
        primaryColor: 0xffffff,
        secondaryColor: 0x000000,
        accessoryColor: 0x888888,
        x: 0,
        y: 0,
      });

      const statusChanges: string[] = [];
      sprite.onStatusChange = (agent, status) => {
        statusChanges.push(status);
      };

      sprite.setStatus('thinking');
      expect(sprite.getStatus()).toBe('thinking');
      expect(statusChanges).toContain('thinking');

      sprite.setStatus('speaking');
      expect(sprite.getStatus()).toBe('speaking');

      sprite.setStatus('working');
      expect(sprite.getStatus()).toBe('working');
    });

    it('should handle selection state', () => {
      const sprite = new AgentSprite({
        id: 'test',
        name: 'Test',
        role: 'Test',
        description: 'Test',
        primaryColor: 0xffffff,
        secondaryColor: 0x000000,
        accessoryColor: 0x888888,
        x: 0,
        y: 0,
      });

      expect(sprite.isSelected()).toBe(false);

      sprite.setSelected(true);
      expect(sprite.isSelected()).toBe(true);

      sprite.setSelected(false);
      expect(sprite.isSelected()).toBe(false);
    });

    it('should trigger onClick callback', () => {
      const sprite = new AgentSprite({
        id: 'test',
        name: 'Test',
        role: 'Test',
        description: 'Test',
        primaryColor: 0xffffff,
        secondaryColor: 0x000000,
        accessoryColor: 0x888888,
        x: 0,
        y: 0,
      });

      let clicked = false;
      sprite.onClick = () => {
        clicked = true;
      };

      // Simulate click by calling handler directly
      sprite.onClick?.(sprite);
      expect(clicked).toBe(true);
    });

    it('should move to new position', () => {
      const sprite = new AgentSprite({
        id: 'test',
        name: 'Test',
        role: 'Test',
        description: 'Test',
        primaryColor: 0xffffff,
        secondaryColor: 0x000000,
        accessoryColor: 0x888888,
        x: 0,
        y: 0,
      });

      sprite.moveTo(100, 200);
      expect(sprite.x).toBe(100);
      expect(sprite.y).toBe(200);
    });

    it('should handle visibility state', () => {
      const sprite = new AgentSprite({
        id: 'test',
        name: 'Test',
        role: 'Test',
        description: 'Test',
        primaryColor: 0xffffff,
        secondaryColor: 0x000000,
        accessoryColor: 0x888888,
        x: 0,
        y: 0,
      });

      expect(sprite.visible).toBe(true);

      sprite.setVisible(false);
      expect(sprite.visible).toBe(false);

      sprite.setVisible(true);
      expect(sprite.visible).toBe(true);
    });
  });

  describe('Agent Type Instances', () => {
    it('should create MentorAgent with correct configuration', () => {
      const mentor = new MentorAgent(100, 200);

      expect(mentor.id).toBe('mentor');
      expect(mentor.name).toBe('智慧导师');
      expect(mentor.role).toBe('Mentor');
      expect(mentor).toBeInstanceOf(AgentSprite);
    });

    it('should create DesignerAgent with correct configuration', () => {
      const designer = new DesignerAgent(100, 200);

      expect(designer.id).toBe('designer');
      expect(designer.name).toBe('创意设计师');
      expect(designer.role).toBe('Designer');
      expect(designer).toBeInstanceOf(AgentSprite);
    });

    it('should create AnalystAgent with correct configuration', () => {
      const analyst = new AnalystAgent(100, 200);

      expect(analyst.id).toBe('analyst');
      expect(analyst.name).toBe('数据分析师');
      expect(analyst.role).toBe('Analyst');
      expect(analyst).toBeInstanceOf(AgentSprite);
    });

    it('should create MarketerAgent with correct configuration', () => {
      const marketer = new MarketerAgent(100, 200);

      expect(marketer.id).toBe('marketer');
      expect(marketer.name).toBe('运营推广师');
      expect(marketer.role).toBe('Marketer');
      expect(marketer).toBeInstanceOf(AgentSprite);
    });

    it('should create AssistantAgent with correct configuration', () => {
      const assistant = new AssistantAgent(100, 200);

      expect(assistant.id).toBe('assistant');
      expect(assistant.name).toBe('CEO 助手');
      expect(assistant.role).toBe('Assistant');
      expect(assistant).toBeInstanceOf(AgentSprite);
    });
  });

  describe('Agent State Management', () => {
    it('should return current state', () => {
      const sprite = new AgentSprite({
        id: 'test',
        name: 'Test',
        role: 'Test',
        description: 'Test',
        primaryColor: 0xffffff,
        secondaryColor: 0x000000,
        accessoryColor: 0x888888,
        x: 0,
        y: 0,
      });

      const state = sprite.getState();

      expect(state).toHaveProperty('status');
      expect(state).toHaveProperty('isHovered');
      expect(state).toHaveProperty('isSelected');
      expect(state).toHaveProperty('isVisible');
      expect(state).toHaveProperty('targetX');
      expect(state).toHaveProperty('targetY');
    });

    it('should maintain independent state for multiple instances', () => {
      const sprite1 = new AgentSprite({
        id: 'agent1',
        name: 'Agent 1',
        role: 'Role 1',
        description: 'Description 1',
        primaryColor: 0xff0000,
        secondaryColor: 0x00ff00,
        accessoryColor: 0x0000ff,
        x: 0,
        y: 0,
      });

      const sprite2 = new AgentSprite({
        id: 'agent2',
        name: 'Agent 2',
        role: 'Role 2',
        description: 'Description 2',
        primaryColor: 0x00ff00,
        secondaryColor: 0xff0000,
        accessoryColor: 0x0000ff,
        x: 100,
        y: 200,
      });

      sprite1.setStatus('thinking');
      sprite2.setStatus('speaking');

      expect(sprite1.getStatus()).toBe('thinking');
      expect(sprite2.getStatus()).toBe('speaking');
      expect(sprite1.x).toBe(0);
      expect(sprite2.x).toBe(100);
    });
  });
});
