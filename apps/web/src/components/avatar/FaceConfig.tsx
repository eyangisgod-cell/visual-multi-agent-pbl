'use client'

import React from 'react'
import type { EyeStyle, MouthStyle } from './types'

interface FaceConfigProps {
  eyes: EyeStyle
  eyeColor: string
  mouth: MouthStyle
  onEyesChange: (style: EyeStyle) => void
  onEyeColorChange: (color: string) => void
  onMouthChange: (style: MouthStyle) => void
}

const eyeStyles: { value: EyeStyle; label: string }[] = [
  { value: 'round', label: '圆形' },
  { value: 'almond', label: '杏仁' },
  { value: 'hooded', label: '下垂' },
  { value: 'downturned', label: '下弯' },
]

const mouthStyles: { value: MouthStyle; label: string }[] = [
  { value: 'smile', label: '微笑' },
  { value: 'neutral', label: '自然' },
  { value: 'grin', label: '露齿' },
  { value: 'serious', label: '严肃' },
]

const presetColors = [
  '#1e40af', '#047857', '#b91c1c', '#b45309', '#7c3aed',
  '#4f46e5', '#059669', '#dc2626', '#f59e0b', '#8b5cf6',
]

export default function FaceConfig({
  eyes,
  eyeColor,
  mouth,
  onEyesChange,
  onEyeColorChange,
  onMouthChange,
}: FaceConfigProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">面部配置</h3>

      <div className="space-y-2">
        <label className="block text-sm font-medium">眼睛形状</label>
        <div className="grid grid-cols-2 gap-2">
          {eyeStyles.map((style) => (
            <button
              key={style.value}
              onClick={() => onEyesChange(style.value)}
              className={`px-3 py-2 rounded border ${
                eyes === style.value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">眼睛颜色</label>
        <div className="grid grid-cols-5 gap-2">
          {presetColors.map((color) => (
            <button
              key={color}
              onClick={() => onEyeColorChange(color)}
              className={`w-8 h-8 rounded border-2 ${
                eyeColor === color ? 'border-gray-900' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <input
          type="color"
          value={eyeColor}
          onChange={(e) => onEyeColorChange(e.target.value)}
          className="w-full h-10 rounded cursor-pointer"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">嘴巴形状</label>
        <div className="grid grid-cols-2 gap-2">
          {mouthStyles.map((style) => (
            <button
              key={style.value}
              onClick={() => onMouthChange(style.value)}
              className={`px-3 py-2 rounded border ${
                mouth === style.value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
