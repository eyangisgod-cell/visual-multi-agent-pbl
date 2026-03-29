'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as PIXI from 'pixi.js'
import type { AgentAvatarConfig } from './types'

interface AvatarPreviewProps {
  config: AgentAvatarConfig
}

export default function AvatarPreview({ config }: AvatarPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<PIXI.Application | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    // Create PIXI Application
    const app = new PIXI.Application({
      width: 300,
      height: 400,
      backgroundColor: 0xf3f4f6,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
    })

    containerRef.current.appendChild(app.canvas)
    appRef.current = app

    // Create avatar container
    const avatarContainer = new PIXI.Container()
    avatarContainer.x = 150
    avatarContainer.y = 200
    app.stage.addChild(avatarContainer)

    // Draw body
    const bodyGraphics = new PIXI.Graphics()
    bodyGraphics.beginFill(parseInt(config.bodyColor.slice(1), 16))
    bodyGraphics.drawRoundedRect(-40, -60, 80, 120, 20)
    bodyGraphics.endFill()
    avatarContainer.addChild(bodyGraphics)

    // Draw head
    const headGraphics = new PIXI.Graphics()
    headGraphics.beginFill(0xffdbac)
    switch (config.headShape) {
      case 'round':
        headGraphics.drawCircle(0, -90, 50)
        break
      case 'oval':
        headGraphics.drawEllipse(0, -90, 45, 55)
        break
      case 'square':
        headGraphics.drawRect(-45, -120, 90, 70)
        break
      case 'heart':
        headGraphics.drawCircle(-20, -95, 40)
        headGraphics.drawCircle(20, -95, 40)
        headGraphics.moveTo(-45, -90)
        headGraphics.lineTo(0, -40)
        headGraphics.lineTo(45, -90)
        break
    }
    headGraphics.endFill()
    avatarContainer.addChild(headGraphics)

    // Draw hair
    const hairGraphics = new PIXI.Graphics()
    hairGraphics.beginFill(parseInt(config.hairColor.slice(1), 16))
    switch (config.hairstyle) {
      case 'short':
        hairGraphics.drawCircle(0, -100, 48)
        break
      case 'long':
        hairGraphics.drawCircle(0, -100, 50)
        hairGraphics.drawRect(-50, -80, 20, 80)
        hairGraphics.drawRect(30, -80, 20, 80)
        break
      case 'bald':
        // No hair
        break
      case 'ponytail':
        hairGraphics.drawCircle(0, -100, 45)
        hairGraphics.drawCircle(60, -60, 25)
        break
      case 'bob':
        hairGraphics.drawCircle(0, -100, 48)
        hairGraphics.drawRect(-55, -85, 15, 50)
        hairGraphics.drawRect(40, -85, 15, 50)
        break
    }
    hairGraphics.endFill()
    avatarContainer.addChild(hairGraphics)

    // Draw eyes
    const eyeGraphics = new PIXI.Graphics()
    eyeGraphics.beginFill(parseInt(config.eyeColor.slice(1), 16))
    switch (config.eyes) {
      case 'round':
        eyeGraphics.drawCircle(-20, -85, 8)
        eyeGraphics.drawCircle(20, -85, 8)
        break
      case 'almond':
        eyeGraphics.drawEllipse(-20, -85, 10, 7)
        eyeGraphics.drawEllipse(20, -85, 10, 7)
        break
      case 'hooded':
        eyeGraphics.drawCircle(-20, -83, 7)
        eyeGraphics.drawCircle(20, -83, 7)
        break
      case 'downturned':
        eyeGraphics.drawEllipse(-20, -82, 9, 6)
        eyeGraphics.drawEllipse(20, -82, 9, 6)
        break
    }
    eyeGraphics.endFill()
    avatarContainer.addChild(eyeGraphics)

    // Draw mouth
    const mouthGraphics = new PIXI.Graphics()
    mouthGraphics.lineStyle(3, 0x333333)
    switch (config.mouth) {
      case 'smile':
        mouthGraphics.arc(0, -65, 15, 0, Math.PI)
        break
      case 'neutral':
        mouthGraphics.moveTo(-10, -65)
        mouthGraphics.lineTo(10, -65)
        break
      case 'grin':
        mouthGraphics.arc(0, -65, 12, 0, Math.PI)
        mouthGraphics.beginFill(0xffffff)
        mouthGraphics.drawEllipse(0, -62, 10, 5)
        break
      case 'serious':
        mouthGraphics.moveTo(-12, -60)
        mouthGraphics.lineTo(12, -60)
        break
    }
    avatarContainer.addChild(mouthGraphics)

    // Draw outfit
    const outfitGraphics = new PIXI.Graphics()
    outfitGraphics.beginFill(parseInt(config.outfitColor.slice(1), 16))
    switch (config.outfit) {
      case 'casual':
        outfitGraphics.drawRect(-35, 20, 70, 60)
        break
      case 'formal':
        outfitGraphics.drawRect(-35, 20, 70, 70)
        outfitGraphics.beginFill(0xffffff)
        outfitGraphics.moveTo(-5, 20)
        outfitGraphics.lineTo(0, 50)
        outfitGraphics.lineTo(5, 20)
        break
      case 'sporty':
        outfitGraphics.drawRect(-38, 20, 76, 55)
        outfitGraphics.lineStyle(2, 0xffffff)
        outfitGraphics.moveTo(-30, 35)
        outfitGraphics.lineTo(30, 35)
        break
      case 'creative':
        outfitGraphics.drawRoundedRect(-40, 20, 80, 65, 10)
        break
      case 'academic':
        outfitGraphics.drawRect(-35, 20, 70, 75)
        outfitGraphics.beginFill(0x1e3a5f)
        outfitGraphics.drawCircle(0, 50, 8)
        break
    }
    outfitGraphics.endFill()
    avatarContainer.addChild(outfitGraphics)

    setIsReady(true)

    return () => {
      app.destroy(true, { children: true })
      appRef.current = null
    }
  }, [config])

  return (
    <div className="flex flex-col items-center">
      <div ref={containerRef} className="rounded-lg overflow-hidden shadow-lg" />
      {!isReady && <p className="mt-2 text-sm text-gray-500">正在加载预览...</p>}
    </div>
  )
}
