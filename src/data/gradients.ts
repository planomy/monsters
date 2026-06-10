export interface DarkGradient {
  id: string
  name: string
  css: string
}

export const DEFAULT_DARK_GRADIENT_ID = 'eggplant'

export const DARK_GRADIENTS: DarkGradient[] = [
  {
    id: 'eggplant',
    name: 'Eggplant',
    css: 'linear-gradient(145deg, #1a0a2e 0%, #3b1d5c 38%, #160820 72%, #050208 100%)',
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
    id: 'aubergine',
    name: 'Aubergine',
    css: 'linear-gradient(125deg, #2a1235 0%, #5b2d6e 40%, #140818 100%)',
  },
  {
    id: 'shadow-grape',
    name: 'Shadow Grape',
    css: 'linear-gradient(165deg, #12081c 0%, #32204a 55%, #08040e 100%)',
  },
  {
    id: 'twilight',
    name: 'Twilight',
    css: 'linear-gradient(200deg, #1a0f2e 0%, #312e81 48%, #0a0612 100%)',
  },
  {
    id: 'ink-orchid',
    name: 'Ink Orchid',
    css: 'linear-gradient(145deg, #0c0614 0%, #581c87 35%, #1a0a28 70%, #030106 100%)',
  },
  {
    id: 'smoky-amethyst',
    name: 'Smoky',
    css: 'linear-gradient(170deg, #18101f 0%, #3f2d56 50%, #0d0812 100%)',
  },
  {
    id: 'violet-dusk',
    name: 'Violet Dusk',
    css: 'linear-gradient(135deg, #2d1b69 0%, #6d28d9 30%, #1a0a2e 65%, #050208 100%)',
  },
]

const gradientById = new Map(DARK_GRADIENTS.map((g) => [g.id, g]))

export function getDarkGradient(id: string): DarkGradient {
  return gradientById.get(id) ?? DARK_GRADIENTS[0]
}
