'use client'

import React, { useState } from 'react'
import AvatarPreview from '@/components/avatar/AvatarPreview'
import BodyConfig from '@/components/avatar/BodyConfig'
import HeadConfig from '@/components/avatar/HeadConfig'
import FaceConfig from '@/components/avatar/FaceConfig'
import OutfitConfig from '@/components/avatar/OutfitConfig'
import type { AgentAvatarConfig, BodyType, HeadShape, Hairstyle, EyeStyle, MouthStyle, OutfitType } from '@/components/avatar/types'
import { mentor, analyst, designer, marketer, assistant } from '@/components/avatar/presets'

const defaultConfig: AgentAvatarConfig = {
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
}

const presets = [mentor, analyst, designer, marketer, assistant]

export default function AgentAvatarConfigurator() {
  const [config, setConfig] = useState<AgentAvatarConfig>(defaultConfig)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  const updateConfig = (updates: Partial<AgentAvatarConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }))
    setSelectedPreset(null)
  }

  const applyPreset = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId)
    if (preset) {
      setConfig(preset.config)
      setSelectedPreset(presetId)
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch('/api/admin/agents/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (response.ok) {
        alert('配置已保存')
      }
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">智能体形象配置器</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Preview and Presets */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">预览</h2>
              <AvatarPreview config={config} />
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">预设模板</h2>
              <div className="grid grid-cols-2 gap-3">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset.id)}
                    className={`p-4 rounded border text-left ${
                      selectedPreset === preset.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-300 hover:border-indigo-400'
                    }`}
                  >
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-sm text-gray-500">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Configuration Panels */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <BodyConfig
                bodyType={config.bodyType}
                bodyColor={config.bodyColor}
                onBodyTypeChange={(type) => updateConfig({ bodyType: type as BodyType })}
                onBodyColorChange={(color) => updateConfig({ bodyColor: color })}
              />
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <HeadConfig
                headShape={config.headShape}
                hairstyle={config.hairstyle}
                hairColor={config.hairColor}
                onHeadShapeChange={(shape) => updateConfig({ headShape: shape as HeadShape })}
                onHairstyleChange={(style) => updateConfig({ hairstyle: style as Hairstyle })}
                onHairColorChange={(color) => updateConfig({ hairColor: color })}
              />
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <FaceConfig
                eyes={config.eyes}
                eyeColor={config.eyeColor}
                mouth={config.mouth}
                onEyesChange={(style) => updateConfig({ eyes: style as EyeStyle })}
                onEyeColorChange={(color) => updateConfig({ eyeColor: color })}
                onMouthChange={(style) => updateConfig({ mouth: style as MouthStyle })}
              />
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <OutfitConfig
                outfit={config.outfit}
                outfitColor={config.outfitColor}
                onOutfitChange={(type) => updateConfig({ outfit: type as OutfitType })}
                onOutfitColorChange={(color) => updateConfig({ outfitColor: color })}
              />
            </div>

            <button
              onClick={handleSave}
              className="w-full py-3 px-6 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
            >
              保存配置
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
