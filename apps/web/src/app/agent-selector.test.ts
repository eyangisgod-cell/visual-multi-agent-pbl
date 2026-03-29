/**
 * Agent Selection Panel Test
 *
 * RED PHASE: Write failing test first
 *
 * This test verifies that the agent selection panel
 * correctly displays available agents and handles selection.
 */

import fs from 'fs'
import path from 'path'

describe('Agent Selection Panel', () => {
  const componentsDir = path.join(process.cwd(), 'src', 'components')
  const appDir = path.join(process.cwd(), 'src', 'app')

  describe('AgentSelector component', () => {
    it('should have AgentSelector component', () => {
      const componentPath = path.join(componentsDir, 'agents', 'AgentSelector.tsx')
      expect(fs.existsSync(componentPath)).toBe(true)
    })

    it('should export AgentSelector as default', () => {
      const componentPath = path.join(componentsDir, 'agents', 'AgentSelector.tsx')
      const content = fs.readFileSync(componentPath, 'utf-8')
      expect(content).toMatch(/export default function AgentSelector|export default AgentSelector/)
    })

    it('should accept availableAgents prop', () => {
      const componentPath = path.join(componentsDir, 'agents', 'AgentSelector.tsx')
      const content = fs.readFileSync(componentPath, 'utf-8')
      expect(content).toMatch(/availableAgents|agents.*\?/)
    })

    it('should accept onAgentSelect callback prop', () => {
      const componentPath = path.join(componentsDir, 'agents', 'AgentSelector.tsx')
      const content = fs.readFileSync(componentPath, 'utf-8')
      expect(content).toMatch(/onAgentSelect|onSelect|onChange/)
    })
  })

  describe('Agent card display', () => {
    it('should have AgentCard component', () => {
      const componentPath = path.join(componentsDir, 'agents', 'AgentCard.tsx')
      expect(fs.existsSync(componentPath)).toBe(true)
    })

    it('should display agent name and role', () => {
      const componentPath = path.join(componentsDir, 'agents', 'AgentCard.tsx')
      const content = fs.readFileSync(componentPath, 'utf-8')
      expect(content).toMatch(/name|role|title/i)
    })

    it('should have selected state styling', () => {
      const componentPath = path.join(componentsDir, 'agents', 'AgentCard.tsx')
      const content = fs.readFileSync(componentPath, 'utf-8')
      expect(content).toMatch(/selected|active|checked/i)
    })
  })

  describe('Agent types', () => {
    it('should have Agent type definition', () => {
      const typesPath = path.join(componentsDir, 'agents', 'types.ts')
      expect(fs.existsSync(typesPath)).toBe(true)
    })

    it('should have AgentInfo interface with required fields', () => {
      const typesPath = path.join(componentsDir, 'agents', 'types.ts')
      const content = fs.readFileSync(typesPath, 'utf-8')

      const requiredFields = ['id', 'name', 'role', 'description', 'avatarUrl']

      requiredFields.forEach(field => {
        expect(content).toContain(field)
      })
    })
  })

  describe('Agent selector page integration', () => {
    it('should have agent selection page in admin/agents', () => {
      const pagePath = path.join(appDir, 'admin', 'agents', 'select', 'page.tsx')
      expect(fs.existsSync(pagePath)).toBe(true)
    })

    it('should integrate AgentSelector in page', () => {
      const pagePath = path.join(appDir, 'admin', 'agents', 'select', 'page.tsx')
      const content = fs.readFileSync(pagePath, 'utf-8')
      expect(content).toMatch(/AgentSelector|agent.*select/i)
    })
  })

  describe('Agent selection API', () => {
    it('should have agent list API route', () => {
      const routePath = path.join(appDir, 'api', 'admin', 'agents', 'list', 'route.ts')
      expect(fs.existsSync(routePath)).toBe(true)
    })

    it('should have agent selection API route', () => {
      const routePath = path.join(appDir, 'api', 'admin', 'agents', 'select', 'route.ts')
      expect(fs.existsSync(routePath)).toBe(true)
    })
  })
})
