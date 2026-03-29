/**
 * Agent Avatar Configurator Test
 *
 * RED PHASE: Write failing test first
 *
 * This test verifies that the agent avatar configurator
 * correctly handles configuration and preview.
 */

import fs from 'fs'
import path from 'path'

describe('Agent Avatar Configurator', () => {
  const appDir = path.join(process.cwd(), 'src', 'app')
  const componentsDir = path.join(process.cwd(), 'src', 'components')

  describe('Configurator page', () => {
    it('should have configurator page in admin/agents', () => {
      const pagePath = path.join(appDir, 'admin', 'agents', 'configurator', 'page.tsx')
      expect(fs.existsSync(pagePath)).toBe(true)
    })

    it('should export default component from page', () => {
      const pagePath = path.join(appDir, 'admin', 'agents', 'configurator', 'page.tsx')
      const pageContent = fs.readFileSync(pagePath, 'utf-8')
      expect(pageContent).toMatch(/export default function|export default Page/)
    })
  })

  describe('AvatarPreview component', () => {
    it('should have AvatarPreview component', () => {
      const componentPath = path.join(componentsDir, 'avatar', 'AvatarPreview.tsx')
      expect(fs.existsSync(componentPath)).toBe(true)
    })

    it('should use PixiJS for rendering', () => {
      const componentPath = path.join(componentsDir, 'avatar', 'AvatarPreview.tsx')
      const content = fs.readFileSync(componentPath, 'utf-8')
      expect(content).toMatch(/pixi\.js|PIXI|Application|Container/)
    })
  })

  describe('Configuration panels', () => {
    it('should have BodyConfig component', () => {
      const componentPath = path.join(componentsDir, 'avatar', 'BodyConfig.tsx')
      expect(fs.existsSync(componentPath)).toBe(true)
    })

    it('should have HeadConfig component', () => {
      const componentPath = path.join(componentsDir, 'avatar', 'HeadConfig.tsx')
      expect(fs.existsSync(componentPath)).toBe(true)
    })

    it('should have FaceConfig component', () => {
      const componentPath = path.join(componentsDir, 'avatar', 'FaceConfig.tsx')
      expect(fs.existsSync(componentPath)).toBe(true)
    })

    it('should have OutfitConfig component', () => {
      const componentPath = path.join(componentsDir, 'avatar', 'OutfitConfig.tsx')
      expect(fs.existsSync(componentPath)).toBe(true)
    })
  })

  describe('Avatar configuration types', () => {
    it('should have AgentAvatarConfig interface definition', () => {
      const typesPath = path.join(componentsDir, 'avatar', 'types.ts')
      expect(fs.existsSync(typesPath)).toBe(true)
    })

    it('should have all required configuration fields', () => {
      const typesPath = path.join(componentsDir, 'avatar', 'types.ts')
      const content = fs.readFileSync(typesPath, 'utf-8')

      const requiredFields = [
        'bodyType',
        'bodyColor',
        'headShape',
        'hairstyle',
        'hairColor',
        'eyes',
        'eyeColor',
        'mouth',
        'outfit',
        'outfitColor',
      ]

      requiredFields.forEach(field => {
        expect(content).toContain(field)
      })
    })
  })

  describe('Avatar presets', () => {
    it('should have presets directory', () => {
      const presetsDir = path.join(componentsDir, 'avatar', 'presets')
      expect(fs.existsSync(presetsDir)).toBe(true)
    })

    it('should have at least one preset configuration', () => {
      const presetsDir = path.join(componentsDir, 'avatar', 'presets')
      if (!fs.existsSync(presetsDir)) {
        throw new Error('Presets directory not found')
      }
      const presetFiles = fs.readdirSync(presetsDir).filter(f => f.endsWith('.ts'))
      expect(presetFiles.length).toBeGreaterThan(0)
    })

    it('should have mentor preset', () => {
      const presetPath = path.join(componentsDir, 'avatar', 'presets', 'mentor.ts')
      expect(fs.existsSync(presetPath)).toBe(true)
    })
  })

  describe('API routes', () => {
    const apiDir = path.join(appDir, 'api', 'admin', 'agents')

    it('should have presets API route', () => {
      const routePath = path.join(apiDir, 'presets', 'route.ts')
      expect(fs.existsSync(routePath)).toBe(true)
    })

    it('should have avatar API route', () => {
      const routePath = path.join(apiDir, 'avatar', 'route.ts')
      expect(fs.existsSync(routePath)).toBe(true)
    })
  })
})
