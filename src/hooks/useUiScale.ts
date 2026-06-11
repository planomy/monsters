import { useCallback, useEffect, useState } from 'react'

export type UiScaleId = 'small' | 'medium' | 'large' | 'xlarge'

export const UI_SCALE_OPTIONS: { id: UiScaleId; label: string; factor: number }[] = [
  { id: 'small', label: 'S', factor: 0.85 },
  { id: 'medium', label: 'M', factor: 1 },
  { id: 'large', label: 'L', factor: 1.2 },
  { id: 'xlarge', label: 'XL', factor: 1.45 },
]

const STORAGE_KEY = 'monsterz-ui-scale'
const DEFAULT_SCALE: UiScaleId = 'medium'

function getStoredScale(): UiScaleId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (UI_SCALE_OPTIONS.some((option) => option.id === stored)) {
      return stored as UiScaleId
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_SCALE
}

function scaleFactor(id: UiScaleId): number {
  return UI_SCALE_OPTIONS.find((option) => option.id === id)?.factor ?? 1
}

export function applyUiScale(id: UiScaleId) {
  const factor = scaleFactor(id)
  document.documentElement.dataset.uiScale = id
  document.documentElement.style.setProperty('--ui-scale', String(factor))
}

export function initUiScale() {
  applyUiScale(getStoredScale())
}

export function useUiScale() {
  const [scaleId, setScaleIdState] = useState<UiScaleId>(() => getStoredScale())

  const setScaleId = useCallback((next: UiScaleId) => {
    setScaleIdState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
    applyUiScale(next)
  }, [])

  const increase = useCallback(() => {
    const index = UI_SCALE_OPTIONS.findIndex((option) => option.id === scaleId)
    if (index < UI_SCALE_OPTIONS.length - 1) {
      setScaleId(UI_SCALE_OPTIONS[index + 1].id)
    }
  }, [scaleId, setScaleId])

  const decrease = useCallback(() => {
    const index = UI_SCALE_OPTIONS.findIndex((option) => option.id === scaleId)
    if (index > 0) {
      setScaleId(UI_SCALE_OPTIONS[index - 1].id)
    }
  }, [scaleId, setScaleId])

  useEffect(() => {
    applyUiScale(scaleId)
  }, [scaleId])

  const current = UI_SCALE_OPTIONS.find((option) => option.id === scaleId) ?? UI_SCALE_OPTIONS[1]

  return {
    scaleId,
    scaleLabel: current.label,
    scaleFactor: current.factor,
    canDecrease: scaleId !== UI_SCALE_OPTIONS[0].id,
    canIncrease: scaleId !== UI_SCALE_OPTIONS[UI_SCALE_OPTIONS.length - 1].id,
    setScaleId,
    increase,
    decrease,
  }
}
