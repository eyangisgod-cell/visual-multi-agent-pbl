'use client'

import React from 'react'
import type { OutfitType } from './types'

interface OutfitConfigProps {
  outfit: OutfitType
  outfitColor: string
  onOutfitChange: (type: OutfitType) => void
  onOutfitColorChange: (color: string) => void
}

const outfitTypes: { value: OutfitType; label: string }[] = [
  { value: 'casual', label: '休闲' },
  { value: 'formal', label: '正式' },
  { value: 'sporty', label: '运动' },
  { value: 'creative', label: '创意' },
  { value: 'academic', label: '学术' },
]

const presetColors = [
  '#6366f1', '#10b981', '#ef4444', '#fbbf24', '#a78bfa',
  '#4f46e5', '#059669', '#dc2626', '#f59e0b', '#8b5cf6',
]

export default function OutfitConfig({
  outfit,
  outfitColor,
  onOutfitChange,
  onOutfitColorChange,
}: OutfitConfigProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">服装配置</h3>

      <div className="space-y-2">
        <label className="block text-sm font-medium">服装类型</label>
        <div className="grid grid-cols-3 gap-2">
          {outfitTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => onOutfitChange(type.value)}
              className={`px-3 py-2 rounded border ${
                outfit === type.value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">服装颜色</label>
        <div className="grid grid-cols-5 gap-2">
          {presetColors.map((color) => (
            <button
              key={color}
              onClick={() => onOutfitColorChange(color)}
              className={`w-8 h-8 rounded border-2 ${
                outfitColor === color ? 'border-gray-900' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <input
          type="color"
          value={outfitColor}
          onChange={(e) => onOutfitColorChange(e.target.value)}
          className="w-full h-10 rounded cursor-pointer"
        />
      </div>
    </div>
  )
}
