import { createDefaultStudents } from '../data/defaults'
import type { AppState } from '../types'

const STORAGE_KEY = 'monsterz-app-state'
const STORAGE_VERSION = 1

interface StoredPayload {
  version: number
  state: AppState
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {
        students: createDefaultStudents(),
        className: 'My Class',
        lastSaved: null,
      }
    }

    const parsed = JSON.parse(raw) as StoredPayload
    if (parsed.version !== STORAGE_VERSION || !parsed.state?.students?.length) {
      return {
        students: createDefaultStudents(),
        className: parsed.state?.className ?? 'My Class',
        lastSaved: null,
      }
    }

    return parsed.state
  } catch {
    return {
      students: createDefaultStudents(),
      className: 'My Class',
      lastSaved: null,
    }
  }
}

export function saveState(state: AppState): AppState {
  const timestamp = new Date().toISOString()
  const nextState: AppState = { ...state, lastSaved: timestamp }

  const payload: StoredPayload = {
    version: STORAGE_VERSION,
    state: nextState,
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  return nextState
}
