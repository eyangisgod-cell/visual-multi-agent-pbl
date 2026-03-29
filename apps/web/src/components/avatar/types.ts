/**
 * Agent Avatar Configuration Types
 */

export type BodyType = 'slim' | 'athletic' | 'curvy' | 'average'
export type HeadShape = 'round' | 'oval' | 'square' | 'heart'
export type Hairstyle = 'short' | 'long' | 'bald' | 'ponytail' | 'bob'
export type EyeStyle = 'round' | 'almond' | 'hooded' | 'downturned'
export type MouthStyle = 'smile' | 'neutral' | 'grin' | 'serious'
export type OutfitType = 'casual' | 'formal' | 'sporty' | 'creative' | 'academic'

export interface AgentAvatarConfig {
  // Body configuration
  bodyType: BodyType
  bodyColor: string

  // Head configuration
  headShape: HeadShape
  hairstyle: Hairstyle
  hairColor: string

  // Face configuration
  eyes: EyeStyle
  eyeColor: string
  mouth: MouthStyle

  // Outfit configuration
  outfit: OutfitType
  outfitColor: string
}

export interface AvatarPreset {
  id: string
  name: string
  description: string
  config: AgentAvatarConfig
}
