'use client'

import React from 'react'
import type { HeadShape, Hairstyle } from './types'

interface HeadConfigProps {
  headShape: HeadShape
  hairstyle: Hairstyle
  hairColor: string
  onHeadShapeChange: (shape: HeadShape) => void
  onHairstyleChange: (style: Hairstyle) => void
  onHairColorChange: (color: string) => void
}

const headShapes: { value: HeadShape; label: string }[] = [
  { value: 'round', label: '圆形' },
  { value: 'oval', label: '椭圆' },
  { value: 'square', label: '方形' },
  { value: 'heart', label: '心形' },
]

const hairstyles: { value: Hairstyle; label: string }[] = [
  { value: 'short', label: '短发' },
  { value: 'long', label: '长发' },
  { value: 'bald', label: '光头' },
  { value: 'ponytail', label: '马尾' },
  { value: 'bob', label: '波波头' },
]

const presetColors = [
  '#4b5563', '#1f2937', '#991b1b', '#d97706', '#6d28d9',
  '#9ca3af', '#4f46e5', '#059669', '#dc2626', '#f59e0b',
]

export default function HeadConfig({
  headShape,
  hairstyle,
  hairColor,
  onHeadShapeChange,
  onHairstyleChange,
  onHairColorChange,
}: HeadConfigProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">头部配置</h3>

      <div className="space-y-2">
        <label className="block text-sm font-medium">头型</label>
        <div className="grid grid-cols-2 gap-2">
          {headShapes.map((shape) => (
            <button
              key={shape.value}
              onClick={() => onHeadShapeChange(shape.value)}
              className={`px-3 py-2 rounded border ${
                headShape === shape.value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
              }`}
            >
              {shape.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">发型</label>
        <div className="grid grid-cols-3 gap-2">
          {hairstyles.map((style) => (
            <button
              key={style.value}
              onClick={() => onHairstyleChange(style.value)}
              className={`px-3 py-2 rounded border ${
                hairstyle === style.value
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
        <label className="block text-sm font-medium">头发颜色</label>
        <div className="grid grid-cols-5 gap-2">
          {presetColors.map((color) => (
            <button
              key={color}
              onClick={() => onHairColorChange(color)}
              className={`w-8 h-8 rounded border-2 ${
                hairColor === color ? 'border-gray-900' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <input
          type="color"
          value={hairColor}
          onChange={(e) => onHairColorChange(e.target.value)}
          className="w-full h-10 rounded cursor-pointer"
        />
      </div>
    </div>
  )
}
