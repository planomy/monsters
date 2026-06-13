export interface DarkGradient {
  id: string
  name: string
  css: string
}

export const DEFAULT_DARK_GRADIENT_ID = 'eggplant'

export const DARK_GRADIENTS: DarkGradient[] = [
  // Purple family
  {
    id: 'eggplant',
    name: 'Eggplant',
    css: 'linear-gradient(155deg, #2a1f42 0%, #3d2d62 24%, #2f2448 48%, #221a36 72%, #1a1528 100%)',
  },
  {
    id: 'royal-plum',
    name: 'Royal Plum',
    css: 'linear-gradient(160deg, #2e1065 0%, #4c1d95 42%, #1e0a3a 100%)',
  },
  {
    id: 'midnight-violet',
    name: 'Midnight',
    css: 'linear-gradient(180deg, #0f0520 0%, #1a1035 45%, #09040f 100%)',
  },
  {
    id: 'cosmic',
    name: 'Cosmic',
    css: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #0c0618 100%)',
  },
  {
    id: 'violet-dusk',
    name: 'Violet Dusk',
    css: 'linear-gradient(135deg, #2d1b69 0%, #6d28d9 30%, #1a0a2e 65%, #050208 100%)',
  },
  // Popular non-purple
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    css: 'linear-gradient(160deg, #0a1628 0%, #1e3a5f 45%, #060b14 100%)',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    css: 'linear-gradient(145deg, #042f2e 0%, #0e4f6e 42%, #021a1f 100%)',
  },
  {
    id: 'forest',
    name: 'Forest',
    css: 'linear-gradient(155deg, #0a1f12 0%, #14532d 40%, #041008 100%)',
  },
  {
    id: 'charcoal',
    name: 'Charcoal',
    css: 'linear-gradient(180deg, #1c1c1e 0%, #2c2c2e 50%, #0a0a0b 100%)',
  },
  {
    id: 'slate',
    name: 'Slate',
    css: 'linear-gradient(165deg, #0f172a 0%, #334155 48%, #020617 100%)',
  },
  {
    id: 'nord',
    name: 'Nord',
    css: 'linear-gradient(145deg, #1b2432 0%, #3b4f68 45%, #0f1419 100%)',
  },
  {
    id: 'ember',
    name: 'Ember',
    css: 'linear-gradient(140deg, #1a0a06 0%, #7c2d12 38%, #140804 100%)',
  },
  {
    id: 'wine',
    name: 'Wine',
    css: 'linear-gradient(150deg, #1a0508 0%, #6b1d2a 42%, #0d0305 100%)',
  },
  {
    id: 'copper',
    name: 'Copper',
    css: 'linear-gradient(155deg, #1a1008 0%, #6b4423 40%, #0d0804 100%)',
  },
  {
    id: 'rose-night',
    name: 'Rose',
    css: 'linear-gradient(145deg, #1a0a10 0%, #6b3048 42%, #0a0508 100%)',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    css: 'linear-gradient(135deg, #061018 0%, #0d4f4f 35%, #1a3a5c 65%, #050810 100%)',
  },
  {
    id: 'graphite',
    name: 'Graphite',
    css: 'linear-gradient(180deg, #121214 0%, #27272a 55%, #09090b 100%)',
  },
  {
    id: 'deep-teal',
    name: 'Deep Teal',
    css: 'linear-gradient(160deg, #042326 0%, #0f5c5c 45%, #021012 100%)',
  },
  {
    id: 'storm',
    name: 'Storm',
    css: 'linear-gradient(200deg, #0c1220 0%, #1e3a5f 50%, #080c14 100%)',
  },
  {
    id: 'mocha',
    name: 'Mocha',
    css: 'linear-gradient(150deg, #1a1410 0%, #4a3728 45%, #0d0a08 100%)',
  },
]

const gradientById = new Map(DARK_GRADIENTS.map((g) => [g.id, g]))

export function getDarkGradient(id: string): DarkGradient {
  return gradientById.get(id) ?? DARK_GRADIENTS[0]
}

// Keep public/gradient-boot.js in sync when adding or changing gradients.
