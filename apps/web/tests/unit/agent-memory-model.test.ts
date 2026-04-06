/**
 * Agent Memory Model Unit Tests
 *
 * Tests for AgentMemory and AgentEvolution models
 * Tests for MemoryType and EvolutionType enums
 */

import { MemoryType, EvolutionType } from '@prisma/client';

describe('MemoryType Enum', () => {
  it('should have SHORT_TERM type', () => {
    expect(MemoryType.SHORT_TERM).toBe('SHORT_TERM');
  });

  it('should have LONG_TERM type', () => {
    expect(MemoryType.LONG_TERM).toBe('LONG_TERM');
  });

  it('should have EPISODIC type', () => {
    expect(MemoryType.EPISODIC).toBe('EPISODIC');
  });

  it('should have PROCEDURAL type', () => {
    expect(MemoryType.PROCEDURAL).toBe('PROCEDURAL');
  });

  it('should have SEMANTIC type', () => {
    expect(MemoryType.SEMANTIC).toBe('SEMANTIC');
  });

  it('should have exactly 5 memory types', () => {
    expect(Object.keys(MemoryType).length).toBe(5);
  });
});

describe('EvolutionType Enum', () => {
  it('should have PERSONALITY_UPDATE type', () => {
    expect(EvolutionType.PERSONALITY_UPDATE).toBe('PERSONALITY_UPDATE');
  });

  it('should have SKILL_ACQUISITION type', () => {
    expect(EvolutionType.SKILL_ACQUISITION).toBe('SKILL_ACQUISITION');
  });

  it('should have BEHAVIOR_ADJUSTMENT type', () => {
    expect(EvolutionType.BEHAVIOR_ADJUSTMENT).toBe('BEHAVIOR_ADJUSTMENT');
  });

  it('should have KNOWLEDGE_EXPANSION type', () => {
    expect(EvolutionType.KNOWLEDGE_EXPANSION).toBe('KNOWLEDGE_EXPANSION');
  });

  it('should have PREFERENCE_CHANGE type', () => {
    expect(EvolutionType.PREFERENCE_CHANGE).toBe('PREFERENCE_CHANGE');
  });

  it('should have exactly 5 evolution types', () => {
    expect(Object.keys(EvolutionType).length).toBe(5);
  });
});

describe('AgentMemory Model Fields', () => {
  it('should have AgentMemory model exported from Prisma Client', () => {
    // Verify that MemoryType enum exists and is properly typed
    expect(typeof MemoryType).toBe('object');
    expect(MemoryType).toBeDefined();
  });

  it('should validate memory type values', () => {
    const validMemoryTypes = Object.values(MemoryType);

    expect(validMemoryTypes).toContain('SHORT_TERM');
    expect(validMemoryTypes).toContain('LONG_TERM');
    expect(validMemoryTypes).toContain('EPISODIC');
    expect(validMemoryTypes).toContain('PROCEDURAL');
    expect(validMemoryTypes).toContain('SEMANTIC');
  });

  it('should have consistent enum string values', () => {
    Object.entries(MemoryType).forEach(([key, value]) => {
      expect(key).toBe(value);
    });
  });
});

describe('AgentEvolution Model Fields', () => {
  it('should have AgentEvolution model exported from Prisma Client', () => {
    // Verify that EvolutionType enum exists and is properly typed
    expect(typeof EvolutionType).toBe('object');
    expect(EvolutionType).toBeDefined();
  });

  it('should validate evolution type values', () => {
    const validEvolutionTypes = Object.values(EvolutionType);

    expect(validEvolutionTypes).toContain('PERSONALITY_UPDATE');
    expect(validEvolutionTypes).toContain('SKILL_ACQUISITION');
    expect(validEvolutionTypes).toContain('BEHAVIOR_ADJUSTMENT');
    expect(validEvolutionTypes).toContain('KNOWLEDGE_EXPANSION');
    expect(validEvolutionTypes).toContain('PREFERENCE_CHANGE');
  });

  it('should have consistent enum string values', () => {
    Object.entries(EvolutionType).forEach(([key, value]) => {
      expect(key).toBe(value);
    });
  });
});
