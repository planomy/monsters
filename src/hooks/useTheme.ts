import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_DARK_GRADIENT_ID, getDarkGradient } from '../data/gradients'

export type ThemePreference = 'light' | 'dark' | 'system'

const THEME_STORAGE_KEY = 'monsterz-theme'
const GRADIENT_STORAGE_KEY = 'monsterz-gradient'

function getStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored
    }
  } catch {
    /* ignore */
  }
  return 'system'
}

function getStoredGradientId(): string {
  try {
    const stored = localStorage.getItem(GRADIENT_STORAGE_KEY)
    if (stored && getDarkGradient(stored).id === stored) {
      return stored
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_DARK_GRADIENT_ID
}

export function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return preference
}

export function applyGradient(gradientId: string) {
  const gradient = getDarkGradient(gradientId)
  document.documentElement.dataset.gradient = gradient.id
  document.documentElement.style.setProperty('--app-gradient', gradient.css)
}

export function applyTheme(preference: ThemePreference, gradientId?: string) {
  const resolved = resolveTheme(preference)
  document.documentElement.dataset.theme = resolved
  document.documentElement.style.colorScheme = resolved
  applyGradient(gradientId ?? getStoredGradientId())
}

export function initTheme() {
  applyTheme(getStoredPreference(), getStoredGradientId())
}

export function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => getStoredPreference())
  const gradientId = getStoredGradientId()

  const setPreference = useCallback(
    (next: ThemePreference) => {
      setPreferenceState(next)
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next)
      } catch {
        /* ignore */
      }
      applyTheme(next, gradientId)
    },
    [gradientId],
  )

  useEffect(() => {
    applyTheme(preference, gradientId)

    if (preference !== 'system') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => applyTheme('system', gradientId)
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [preference, gradientId])

  return {
    preference,
    resolved: resolveTheme(preference),
    setPreference,
  }
}
