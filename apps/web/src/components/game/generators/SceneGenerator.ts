/**
 * 动态场景生成器 - 根据项目元数据自动生成 2D 场景
 * 支持场景类型：校园、实验室、办公室、户外、工厂、艺术工作室
 */

import type * as PIXI from 'pixi.js';

export type SceneType = 'campus' | 'laboratory' | 'office' | 'outdoor' | 'factory' | 'studio';

export interface SceneTemplate {
  id: string;
  type: SceneType;
  name: string;
  description: string;

  // 视觉配置
  groundColor: number;
  skyColor: number;
  lighting: LightingConfig;

  // 元素配置
  buildings: BuildingTemplate[];
  decorations: DecorationTemplate[];
  props: PropTemplate[];

  // 碰撞配置
  collisionZones: CollisionZone[];

  // 出生点配置
  spawnPoints: SpawnPoint[];
}

export interface LightingConfig {
  ambient: number;
  intensity: number;
  shadows: boolean;
}

export interface BuildingTemplate {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  texture: string;
}

export interface DecorationTemplate {
  type: string;
  x: number;
  y: number;
  texture: string;
  scale?: number;
}

export interface PropTemplate {
  type: string;
  x: number;
  y: number;
  texture: string;
  interactive?: boolean;
}

export interface CollisionZone {
  x: number;
  y: number;
  width: number;
  height: number;
  solid: boolean;
}

export interface SpawnPoint {
  x: number;
  y: number;
  label: string;
}

export interface ProjectMeta {
  id: string;
  title: string;
  subject?: string | null;
  difficulty: number;
  tags?: string[];
}

export class SceneGenerator {
  private templates: Map<SceneType, SceneTemplate>;

  constructor() {
    this.templates = new Map();
    this.registerDefaultTemplates();
  }

  /**
   * 根据项目元数据生成场景
   */
  generateFromProject(project: ProjectMeta): SceneTemplate {
    const sceneType = this.determineSceneType(project);
    return this.generate(sceneType, project);
  }

  /**
   * 根据场景类型生成场景
   */
  generate(sceneType: SceneType, project?: ProjectMeta): SceneTemplate {
    const baseTemplate = this.templates.get(sceneType) || this.templates.get('campus')!;

    if (!project) {
      return { ...baseTemplate };
    }

    // 根据项目难度调整场景复杂度
    const complexity = this.getComplexityMultiplier(project.difficulty);

    return {
      ...baseTemplate,
      decorations: this.randomizeDecorations(baseTemplate.decorations, complexity),
      props: this.selectPropsForProject(baseTemplate.props, project),
      lighting: this.adjustLighting(baseTemplate.lighting, sceneType),
    };
  }

  /**
   * 根据项目学科和标签确定场景类型
   */
  private determineSceneType(project: ProjectMeta): SceneType {
    const subjectScenes: Record<string, SceneType> = {
      science: 'laboratory',
      physics: 'laboratory',
      chemistry: 'laboratory',
      biology: 'laboratory',
      business: 'office',
      economics: 'office',
      outdoor: 'outdoor',
      geography: 'outdoor',
      engineering: 'factory',
      technology: 'factory',
      art: 'studio',
      design: 'studio',
    };

    const tagScenes: Record<string, SceneType> = {
      实验: 'laboratory',
      experiment: 'laboratory',
      办公: 'office',
      office: 'office',
      户外: 'outdoor',
      outdoor: 'outdoor',
      制造: 'factory',
      making: 'factory',
      艺术: 'studio',
      art: 'studio',
    };

    // 标签优先级更高
    for (const tag of project.tags || []) {
      if (tagScenes[tag]) return tagScenes[tag];
    }

    // 回退到学科
    if (project.subject && subjectScenes[project.subject]) {
      return subjectScenes[project.subject];
    }

    // 默认校园场景
    return 'campus';
  }

  /**
   * 根据难度获取复杂度乘数
   */
  private getComplexityMultiplier(difficulty: number): number {
    // 难度 1-5，复杂度 0.5-1.5
    return 0.5 + (difficulty - 1) * 0.25;
  }

  /**
   * 随机化装饰元素
   */
  private randomizeDecorations(
    decorations: DecorationTemplate[],
    complexity: number
  ): DecorationTemplate[] {
    const count = Math.floor(decorations.length * complexity);
    return decorations.slice(0, count).map((decor) => ({
      ...decor,
      scale: decor.scale ?? 0.8 + Math.random() * 0.4,
    }));
  }

  /**
   * 根据项目选择道具
   */
  private selectPropsForProject(
    props: PropTemplate[],
    project: ProjectMeta
  ): PropTemplate[] {
    // 简单实现：返回前几个道具
    return props.slice(0, 3);
  }

  /**
   * 调整光照配置
   */
  private adjustLighting(lighting: LightingConfig, sceneType: SceneType): LightingConfig {
    const sceneLighting: Record<SceneType, Partial<LightingConfig>> = {
      campus: { ambient: 0xffffff, intensity: 1.0 },
      laboratory: { ambient: 0xffffff, intensity: 0.9 },
      office: { ambient: 0xffffee, intensity: 0.85 },
      outdoor: { ambient: 0xffffff, intensity: 1.2 },
      factory: { ambient: 0xffffee, intensity: 0.7 },
      studio: { ambient: 0xffffee, intensity: 0.8 },
    };

    return {
      ...lighting,
      ...sceneLighting[sceneType],
    };
  }

  /**
   * 注册默认场景模板
   */
  private registerDefaultTemplates(): void {
    this.templates.set('campus', this.createCampusTemplate());
    this.templates.set('laboratory', this.createLaboratoryTemplate());
    this.templates.set('office', this.createOfficeTemplate());
    this.templates.set('outdoor', this.createOutdoorTemplate());
    this.templates.set('factory', this.createFactoryTemplate());
    this.templates.set('studio', this.createStudioTemplate());
  }

  private createCampusTemplate(): SceneTemplate {
    return {
      id: 'campus-001',
      type: 'campus',
      name: '虚拟校园',
      description: '默认校园场景，包含教学楼、树木和道路',

      groundColor: 0x4a7c59,
      skyColor: 0x87ceeb,

      lighting: {
        ambient: 0xffffff,
        intensity: 1.0,
        shadows: true,
      },

      buildings: [
        {
          type: 'school',
          x: 5,
          y: 5,
          width: 15,
          height: 10,
          texture: 'school-building',
        },
        {
          type: 'school',
          x: 25,
          y: 5,
          width: 12,
          height: 8,
          texture: 'school-building-2',
        },
      ],

      decorations: [
        { type: 'tree', x: 8, y: 20, texture: 'tree-oak', scale: 1.0 },
        { type: 'tree', x: 15, y: 22, texture: 'tree-oak', scale: 0.9 },
        { type: 'tree', x: 22, y: 18, texture: 'tree-pine', scale: 1.1 },
        { type: 'plant', x: 30, y: 15, texture: 'bush', scale: 0.7 },
      ],

      props: [
        { type: 'bench', x: 10, y: 25, texture: 'park-bench', interactive: true },
        { type: 'lamp', x: 18, y: 23, texture: 'street-lamp' },
      ],

      collisionZones: [
        { x: 5, y: 5, width: 15, height: 10, solid: true },
        { x: 25, y: 5, width: 12, height: 8, solid: true },
      ],

      spawnPoints: [
        { x: 15, y: 20, label: 'entrance' },
        { x: 10, y: 15, label: 'plaza' },
      ],
    };
  }

  private createLaboratoryTemplate(): SceneTemplate {
    return {
      id: 'laboratory-001',
      type: 'laboratory',
      name: '科学实验室',
      description: '科学实验场景，包含实验台和设备',

      groundColor: 0x8B9BB4,
      skyColor: 0xE8F4F8,

      lighting: {
        ambient: 0xFFFFFF,
        intensity: 0.8,
        shadows: true,
      },

      buildings: [
        {
          type: 'lab',
          x: 5,
          y: 5,
          width: 12,
          height: 8,
          texture: 'lab-building',
        },
        {
          type: 'lab',
          x: 25,
          y: 5,
          width: 10,
          height: 6,
          texture: 'lab-equipment-room',
        },
      ],

      decorations: [
        { type: 'equipment', x: 8, y: 10, texture: 'microscope' },
        { type: 'equipment', x: 12, y: 10, texture: 'test-tubes' },
        { type: 'furniture', x: 20, y: 8, texture: 'lab-desk' },
        { type: 'furniture', x: 24, y: 8, texture: 'storage-cabinet' },
        { type: 'plant', x: 30, y: 15, texture: 'potted-plant' },
      ],

      props: [
        { type: 'computer', x: 15, y: 12, texture: 'lab-computer', interactive: true },
        { type: 'chalkboard', x: 10, y: 8, texture: 'chalkboard' },
      ],

      collisionZones: [
        { x: 5, y: 5, width: 12, height: 8, solid: true },
        { x: 25, y: 5, width: 10, height: 6, solid: true },
      ],

      spawnPoints: [
        { x: 15, y: 20, label: 'entrance' },
        { x: 10, y: 15, label: 'lab-bench' },
      ],
    };
  }

  private createOfficeTemplate(): SceneTemplate {
    return {
      id: 'office-001',
      type: 'office',
      name: '现代办公室',
      description: '商业办公场景，包含办公桌和会议设施',

      groundColor: 0xC4B5A0,
      skyColor: 0xF5F5DC,

      lighting: {
        ambient: 0xffffee,
        intensity: 0.85,
        shadows: true,
      },

      buildings: [
        {
          type: 'office',
          x: 5,
          y: 5,
          width: 20,
          height: 12,
          texture: 'office-cubicle',
        },
        {
          type: 'office',
          x: 28,
          y: 8,
          width: 8,
          height: 6,
          texture: 'meeting-room',
        },
      ],

      decorations: [
        { type: 'furniture', x: 10, y: 10, texture: 'office-desk' },
        { type: 'furniture', x: 15, y: 10, texture: 'office-chair' },
        { type: 'furniture', x: 20, y: 10, texture: 'filing-cabinet' },
        { type: 'plant', x: 30, y: 12, texture: 'office-plant' },
      ],

      props: [
        { type: 'computer', x: 12, y: 11, texture: 'desktop-pc', interactive: true },
        { type: 'whiteboard', x: 25, y: 9, texture: 'whiteboard' },
      ],

      collisionZones: [
        { x: 5, y: 5, width: 20, height: 12, solid: true },
        { x: 28, y: 8, width: 8, height: 6, solid: true },
      ],

      spawnPoints: [
        { x: 15, y: 18, label: 'entrance' },
        { x: 10, y: 14, label: 'workstation' },
      ],
    };
  }

  private createOutdoorTemplate(): SceneTemplate {
    return {
      id: 'outdoor-001',
      type: 'outdoor',
      name: '户外探索',
      description: '户外自然场景，包含树木和探索路径',

      groundColor: 0x8fbc8f,
      skyColor: 0x87ceeb,

      lighting: {
        ambient: 0xffffff,
        intensity: 1.2,
        shadows: true,
      },

      buildings: [
        {
          type: 'outdoor',
          x: 10,
          y: 5,
          width: 8,
          height: 6,
          texture: 'observation-deck',
        },
      ],

      decorations: [
        { type: 'tree', x: 5, y: 15, texture: 'tree-pine', scale: 1.2 },
        { type: 'tree', x: 25, y: 18, texture: 'tree-oak', scale: 1.1 },
        { type: 'tree', x: 35, y: 12, texture: 'tree-pine', scale: 1.0 },
        { type: 'plant', x: 15, y: 25, texture: 'bush-cluster' },
        { type: 'plant', x: 30, y: 22, texture: 'flowers' },
      ],

      props: [
        { type: 'bench', x: 20, y: 20, texture: 'park-bench', interactive: true },
        { type: 'sign', x: 12, y: 18, texture: 'trail-sign' },
      ],

      collisionZones: [
        { x: 10, y: 5, width: 8, height: 6, solid: true },
      ],

      spawnPoints: [
        { x: 15, y: 25, label: 'trailhead' },
        { x: 20, y: 15, label: 'viewpoint' },
      ],
    };
  }

  private createFactoryTemplate(): SceneTemplate {
    return {
      id: 'factory-001',
      type: 'factory',
      name: '工程车间',
      description: '工程制造场景，包含工作台和机械设备',

      groundColor: 0x696969,
      skyColor: 0xD3D3D3,

      lighting: {
        ambient: 0xffffee,
        intensity: 0.7,
        shadows: true,
      },

      buildings: [
        {
          type: 'factory',
          x: 5,
          y: 5,
          width: 18,
          height: 10,
          texture: 'factory-workshop',
        },
        {
          type: 'factory',
          x: 26,
          y: 8,
          width: 10,
          height: 8,
          texture: 'storage-area',
        },
      ],

      decorations: [
        { type: 'equipment', x: 10, y: 10, texture: 'workbench' },
        { type: 'equipment', x: 18, y: 10, texture: 'drill-press' },
        { type: 'furniture', x: 28, y: 12, texture: 'storage-shelf' },
        { type: 'equipment', x: 32, y: 10, texture: 'conveyor-belt' },
      ],

      props: [
        { type: 'tool', x: 12, y: 12, texture: 'tool-rack', interactive: true },
        { type: 'safety', x: 8, y: 14, texture: 'safety-station' },
      ],

      collisionZones: [
        { x: 5, y: 5, width: 18, height: 10, solid: true },
        { x: 26, y: 8, width: 10, height: 8, solid: true },
      ],

      spawnPoints: [
        { x: 15, y: 18, label: 'entrance' },
        { x: 10, y: 14, label: 'workstation' },
      ],
    };
  }

  private createStudioTemplate(): SceneTemplate {
    return {
      id: 'studio-001',
      type: 'studio',
      name: '艺术工作室',
      description: '艺术创作场景，包含画架和艺术用品',

      groundColor: 0xdeb887,
      skyColor: 0xfff8dc,

      lighting: {
        ambient: 0xffffee,
        intensity: 0.8,
        shadows: true,
      },

      buildings: [
        {
          type: 'studio',
          x: 5,
          y: 5,
          width: 15,
          height: 10,
          texture: 'studio-space',
        },
      ],

      decorations: [
        { type: 'furniture', x: 10, y: 10, texture: 'easel' },
        { type: 'furniture', x: 18, y: 10, texture: 'art-desk' },
        { type: 'furniture', x: 25, y: 12, texture: 'palette-rack' },
        { type: 'plant', x: 30, y: 15, texture: 'dried-flowers' },
      ],

      props: [
        { type: 'art', x: 12, y: 12, texture: 'canvas', interactive: true },
        { type: 'art', x: 20, y: 11, texture: 'paint-brushes' },
      ],

      collisionZones: [
        { x: 5, y: 5, width: 15, height: 10, solid: true },
      ],

      spawnPoints: [
        { x: 15, y: 18, label: 'entrance' },
        { x: 12, y: 14, label: 'workstation' },
      ],
    };
  }
}
