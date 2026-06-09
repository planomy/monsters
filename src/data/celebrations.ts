export const CELEBRATION_VARIANTS = [
  'bounce',
  'wiggle',
  'zoom',
  'float',
  'pulse',
  'spin',
] as const

export type CelebrationVariant = (typeof CELEBRATION_VARIANTS)[number]

export const CELEBRATION_SPARKLES: Record<CelebrationVariant, [string, string, string]> = {
  bounce: ['✦', '★', '✦'],
  wiggle: ['♪', '~', '♪'],
  zoom: ['✸', '★', '✸'],
  float: ['☁', '✨', '☁'],
  pulse: ['💜', '✦', '💜'],
  spin: ['🎉', '✨', '🎉'],
}

export function pickCelebration(): CelebrationVariant {
  const index = Math.floor(Math.random() * CELEBRATION_VARIANTS.length)
  return CELEBRATION_VARIANTS[index]
}

export const CELEBRATION_DURATION_MS = 750
