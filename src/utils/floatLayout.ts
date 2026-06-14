/** Chrome document PiP minimum dimensions (desktop). */
export const PIP_WINDOW_W = 240
export const PIP_MIN_HEIGHT = 52

/** Two equal columns filling the PiP width. */
export const FLOAT_COL_W = PIP_WINDOW_W / 2
export const FLOAT_CARD_H = 44
export const FLOAT_HEAD = 28
export const FLOAT_PILL_SIZE = 36

export function pipPillWindowHeight(): number {
  return PIP_MIN_HEIGHT
}

export function pipPanelWindowHeight(studentCount: number): number {
  const rows = Math.ceil(Math.max(studentCount, 1) / 2)
  return FLOAT_HEAD + rows * FLOAT_CARD_H
}

/** @deprecated use PIP_WINDOW_W */
export const FLOAT_W = PIP_WINDOW_W
/** @deprecated use FLOAT_PILL_SIZE */
export const FLOAT_PILL = FLOAT_PILL_SIZE
