'use client'

import React from 'react'
import type { BodyType } from './types'

interface BodyConfigProps {
  bodyType: BodyType
  bodyColor: string
  onBodyTypeChange: (type: BodyType) => void
  onBodyColorChange: (color: string) => void
}

const bodyTypes: { value: BodyType; label: string }[] = [
  { value: 'slim', label: '纤细' },
  { value: 'average', label: '标准' },
  { value: 'athletic', label: '健壮' },
  { value: 'curvy', label: '丰满' },
]

const presetColors = [
  '#4f46e5', '#059669', '#dc2626', '#f59e0b', '#8b5cf6',
  '#1e40af', '#047857', '#b91c1c', '#b45309', '#7c3aed',
]

export default function BodyConfig({
  bodyType,
  bodyColor,
  onBodyTypeChange,
  onBodyColorChange,
}: BodyConfigProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">身体配置</h3>

      <div className="space-y-2">
        <label className="block text-sm font-medium">体型</label>
        <div className="grid grid-cols-2 gap-2">
          {bodyTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => onBodyTypeChange(type.value)}
              className={`px-3 py-2 rounded border ${
                bodyType === type.value
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
        <label className="block text-sm font-medium">身体颜色</label>
        <div className="grid grid-cols-5 gap-2">
          {presetColors.map((color) => (
            <button
              key={color}
              onClick={() => onBodyColorChange(color)}
              className={`w-8 h-8 rounded border-2 ${
                bodyColor === color ? 'border-gray-900' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <input
          type="color"
          value={bodyColor}
          onChange={(e) => onBodyColorChange(e.target.value)}
          className="w-full h-10 rounded cursor-pointer"
        />
      </div>
    </div>
  )
}
