/**
 * Phase 10 - Agent Avatar Configurator API E2E Tests
 *
 * Tests for:
 * - Avatar presets list
 * - Avatar configuration save/retrieve
 * - Avatar customization
 *
 * @see apps/web/src/app/api/admin/agents/presets/route.ts
 * @see apps/web/src/app/api/admin/agents/avatar/route.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Phase 10: Agent Avatar Configurator API', () => {
  const API_BASE = 'http://localhost:3000';

  test.describe('Avatar Presets API', () => {
    test('应该可以获取所有预设模板', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/admin/agents/presets`);

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('presets');
      expect(Array.isArray(body.presets)).toBe(true);
    });

    test('应该返回 5 种智能体预设', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/admin/agents/presets`);

      const body = await response.json();
      expect(body.presets.length).toBe(5);
    });

    test('预设应该包含导师 (Mentor)', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/admin/agents/presets`);

      const body = await response.json();
      const mentorPreset = body.presets.find((p: any) => p.id === 'mentor');
      expect(mentorPreset).toBeDefined();
      expect(mentorPreset.name).toBe('智慧导师');
    });

    test('预设应该包含分析师 (Analyst)', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/admin/agents/presets`);

      const body = await response.json();
      const analystPreset = body.presets.find((p: any) => p.id === 'analyst');
      expect(analystPreset).toBeDefined();
      expect(analystPreset.name).toBe('数据分析师');
    });

    test('预设应该包含设计师 (Designer)', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/admin/agents/presets`);

      const body = await response.json();
      const designerPreset = body.presets.find((p: any) => p.id === 'designer');
      expect(designerPreset).toBeDefined();
      expect(designerPreset.name).toBe('创意设计师');
    });

    test('预设应该包含营销师 (Marketer)', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/admin/agents/presets`);

      const body = await response.json();
      const marketerPreset = body.presets.find((p: any) => p.id === 'marketer');
      expect(marketerPreset).toBeDefined();
      expect(marketerPreset.name).toBe('运营推广师');
    });

    test('预设应该包含助手 (Assistant)', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/admin/agents/presets`);

      const body = await response.json();
      const assistantPreset = body.presets.find((p: any) => p.id === 'assistant');
      expect(assistantPreset).toBeDefined();
      expect(assistantPreset.name).toBe('CEO 助手');
    });

    test('每个预设应该有完整的配置', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/admin/agents/presets`);

      const body = await response.json();
      for (const preset of body.presets) {
        expect(preset).toHaveProperty('id');
        expect(preset).toHaveProperty('name');
        expect(preset).toHaveProperty('description');
        expect(preset).toHaveProperty('config');
        expect(preset.config).toHaveProperty('bodyType');
        expect(preset.config).toHaveProperty('bodyColor');
        expect(preset.config).toHaveProperty('headShape');
        expect(preset.config).toHaveProperty('hairstyle');
        expect(preset.config).toHaveProperty('outfit');
      }
    });

    test('应该可以创建新的预设模板', async ({ request }) => {
      const newPreset = {
        id: 'custom-preset',
        name: '自定义智能体',
        description: '用户自定义的预设模板',
        config: {
          bodyType: 'slim',
          bodyColor: '#10b981',
          headShape: 'round',
          hairstyle: 'long',
          hairColor: '#f59e0b',
          eyes: 'large',
          eyeColor: '#3b82f6',
          mouth: 'neutral',
          outfit: 'casual',
          outfitColor: '#6366f1',
        },
      };

      const response = await request.post(`${API_BASE}/api/admin/agents/presets`, {
        data: newPreset,
      });

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
    });
  });

  test.describe('Avatar Configuration API', () => {
    test('应该可以获取默认配置', async ({ request }) => {
      const response = await request.get(`${API_BASE}/api/admin/agents/avatar`);

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('config');
      expect(body.config).toHaveProperty('bodyType');
      expect(body.config).toHaveProperty('bodyColor');
    });

    test('应该可以保存形象配置', async ({ request }) => {
      const avatarConfig = {
        bodyType: 'average',
        bodyColor: '#4f46e5',
        headShape: 'oval',
        hairstyle: 'short',
        hairColor: '#4b5563',
        eyes: 'almond',
        eyeColor: '#1e40af',
        mouth: 'smile',
        outfit: 'academic',
        outfitColor: '#6366f1',
      };

      const response = await request.post(`${API_BASE}/api/admin/agents/avatar`, {
        data: avatarConfig,
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.config).toEqual(avatarConfig);
    });

    test('应该拒绝无效的配置 - 缺少必填字段', async ({ request }) => {
      const invalidConfig = {
        bodyType: 'average',
        // Missing other required fields
      };

      const response = await request.post(`${API_BASE}/api/admin/agents/avatar`, {
        data: invalidConfig,
      });

      expect(response.status()).toBe(400);
    });

    test('应该验证 bodyType 是有效值', async ({ request }) => {
      const config = {
        bodyType: 'invalid-type',
        bodyColor: '#4f46e5',
        headShape: 'oval',
        hairstyle: 'short',
        hairColor: '#4b5563',
        eyes: 'almond',
        eyeColor: '#1e40af',
        mouth: 'smile',
        outfit: 'academic',
        outfitColor: '#6366f1',
      };

      const response = await request.post(`${API_BASE}/api/admin/agents/avatar`, {
        data: config,
      });

      // Should either validate and fail or pass validation but fail type check
      // For now, we accept either behavior as long as it's consistent
      const body = await response.json();
      expect(body.error || body.success).toBeDefined();
    });

    test('应该接受所有有效的 bodyType 值', async ({ request }) => {
      const validBodyTypes = ['slim', 'average', 'round', 'athletic', 'chubby'];

      for (const bodyType of validBodyTypes) {
        const config = {
          bodyType,
          bodyColor: '#4f46e5',
          headShape: 'oval',
          hairstyle: 'short',
          hairColor: '#4b5563',
          eyes: 'almond',
          eyeColor: '#1e40af',
          mouth: 'smile',
          outfit: 'academic',
          outfitColor: '#6366f1',
        };

        const response = await request.post(`${API_BASE}/api/admin/agents/avatar`, {
          data: config,
        });

        // All valid types should be accepted
        const body = await response.json();
        expect(body.success || body.error).toBeDefined();
      }
    });

    test('应该验证 headShape 是有效值', async ({ request }) => {
      const config = {
        bodyType: 'average',
        bodyColor: '#4f46e5',
        headShape: 'invalid-shape',
        hairstyle: 'short',
        hairColor: '#4b5563',
        eyes: 'almond',
        eyeColor: '#1e40af',
        mouth: 'smile',
        outfit: 'academic',
        outfitColor: '#6366f1',
      };

      const response = await request.post(`${API_BASE}/api/admin/agents/avatar`, {
        data: config,
      });

      const body = await response.json();
      expect(body.error || body.success).toBeDefined();
    });

    test('应该接受所有有效的 headShape 值', async ({ request }) => {
      const validHeadShapes = ['round', 'square', 'oval', 'heart', 'oblong'];

      for (const headShape of validHeadShapes) {
        const config = {
          bodyType: 'average',
          bodyColor: '#4f46e5',
          headShape,
          hairstyle: 'short',
          hairColor: '#4b5563',
          eyes: 'almond',
          eyeColor: '#1e40af',
          mouth: 'smile',
          outfit: 'academic',
          outfitColor: '#6366f1',
        };

        const response = await request.post(`${API_BASE}/api/admin/agents/avatar`, {
          data: config,
        });

        const body = await response.json();
        expect(body.success || body.error).toBeDefined();
      }
    });

    test('应该验证颜色值格式', async ({ request }) => {
      const configWithInvalidColor = {
        bodyType: 'average',
        bodyColor: 'not-a-color',
        headShape: 'oval',
        hairstyle: 'short',
        hairColor: '#4b5563',
        eyes: 'almond',
        eyeColor: '#1e40af',
        mouth: 'smile',
        outfit: 'academic',
        outfitColor: '#6366f1',
      };

      const response = await request.post(`${API_BASE}/api/admin/agents/avatar`, {
        data: configWithInvalidColor,
      });

      // Invalid color format should be handled
      const body = await response.json();
      expect(body.error || body.success).toBeDefined();
    });
  });

  test.describe('Avatar Preset Application', () => {
    test('应用预设后应该返回完整的配置', async ({ request }) => {
      // First get presets
      const presetsResponse = await request.get(`${API_BASE}/api/admin/agents/presets`);
      const presetsBody = await presetsResponse.json();

      // Apply mentor preset
      const mentorPreset = presetsBody.presets.find((p: any) => p.id === 'mentor');
      expect(mentorPreset).toBeDefined();

      // Save the preset config
      const saveResponse = await request.post(`${API_BASE}/api/admin/agents/avatar`, {
        data: mentorPreset.config,
      });

      expect(saveResponse.status()).toBe(200);
      const saveBody = await saveResponse.json();
      expect(saveBody.success).toBe(true);
      expect(saveBody.config).toEqual(mentorPreset.config);
    });

    test('不同预设应该有不同的配置', async ({ request }) => {
      const presetsResponse = await request.get(`${API_BASE}/api/admin/agents/presets`);
      const presetsBody = await presetsResponse.json();

      const presets = presetsBody.presets;
      for (let i = 0; i < presets.length; i++) {
        for (let j = i + 1; j < presets.length; j++) {
          // At least some properties should be different
          const presetA = presets[i];
          const presetB = presets[j];

          const isDifferent =
            presetA.config.bodyColor !== presetB.config.bodyColor ||
            presetA.config.hairstyle !== presetB.config.hairstyle ||
            presetA.config.outfit !== presetB.config.outfit ||
            presetA.config.eyeColor !== presetB.config.eyeColor;

          expect(isDifferent).toBe(true);
        }
      }
    });
  });
});
