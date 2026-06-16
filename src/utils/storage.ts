import { createDefaultStudents, DEFAULT_CLASS_SIZE } from '../data/defaults'
import type { AppState } from '../types'
import { normalizeState } from './normalize'

const STORAGE_KEY = 'monsterz-app-state'
export const APP_STATE_STORAGE_KEY = STORAGE_KEY
const STORAGE_VERSION = 1

export type StorageMode = 'local' | 'session' | 'memory'

interface StoredPayload {
  version: number
  state: AppState
}

let memoryFallback: string | null = null
let storageMode: StorageMode = 'local'
let unpartitionedStorage: Storage | null = null

export function isEmbedded(): boolean {
  try {
    return window.self !== window.top
  } catch {
    return true
  }
}

export function getStorageMode(): StorageMode {
  return storageMode
}

function activeStorage(): Storage | null {
  if (unpartitionedStorage) return unpartitionedStorage
  try {
    return localStorage
  } catch {
    return null
  }
}

function readRaw(): string | null {
  const local = activeStorage()
  if (local) {
    try {
      const value = local.getItem(STORAGE_KEY)
      if (value) {
        storageMode = 'local'
        return value
      }
    } catch {
      /* fall through */
    }
  }

  try {
    const value = sessionStorage.getItem(STORAGE_KEY)
    if (value) {
      storageMode = 'session'
      return value
    }
  } catch {
    /* fall through */
  }

  return memoryFallback
}

function mirrorStorageToLinkedWindows(value: string): void {
  if (window.opener && !window.opener.closed) {
    try {
      window.opener.localStorage.setItem(STORAGE_KEY, value)
    } catch {
      /* PiP may not reach opener storage in some profiles */
    }
  }

  const pipWindow = window.documentPictureInPicture?.window
  if (pipWindow && !pipWindow.closed) {
    try {
      pipWindow.localStorage.setItem(STORAGE_KEY, value)
    } catch {
      /* ignore */
    }
  }
}

function writeRaw(value: string): boolean {
  const local = activeStorage()
  if (local) {
    try {
      local.setItem(STORAGE_KEY, value)
      storageMode = 'local'
      mirrorStorageToLinkedWindows(value)
      return true
    } catch {
      /* fall through */
    }
  }

  try {
    sessionStorage.setItem(STORAGE_KEY, value)
    storageMode = 'session'
    mirrorStorageToLinkedWindows(value)
    return true
  } catch {
    /* fall through */
  }

  memoryFallback = value
  storageMode = 'memory'
  return true
}

/** Request unpartitioned storage when embedded (needs a user click). */
export async function activateEmbeddedStorage(): Promise<boolean> {
  if (!isEmbedded()) return true

  const doc = document as Document & {
    hasStorageAccess?: () => Promise<boolean>
    requestStorageAccess?: (options?: { localStorage?: boolean }) => Promise<{
      localStorage?: Storage
    }>
  }

  try {
    if (doc.hasStorageAccess && (await doc.hasStorageAccess())) {
      return true
    }
  } catch {
    /* continue */
  }

  if (!doc.requestStorageAccess) {
    return activeStorage() !== null
  }

  try {
    const handle = await doc.requestStorageAccess({ localStorage: true })
    if (handle?.localStorage) {
      unpartitionedStorage = handle.localStorage
      if (memoryFallback) {
        handle.localStorage.setItem(STORAGE_KEY, memoryFallback)
        memoryFallback = null
      }
      storageMode = 'local'
      return true
    }
  } catch {
    return false
  }

  return false
}

export function loadStateFromWindow(target: Window): AppState | null {
  try {
    const raw = target.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as StoredPayload
    if (parsed.version !== STORAGE_VERSION || !parsed.state?.students?.length) {
      return null
    }

    return normalizeState(parsed.state)
  } catch {
    return null
  }
}

export function shouldAcceptSyncedState(prev: AppState, incoming: AppState): boolean {
  if (incoming.classSize > prev.classSize) return true
  if (incoming.classSize < prev.classSize) return false
  if (incoming.lastSaved && prev.lastSaved && incoming.lastSaved > prev.lastSaved) return true
  if (incoming.lastSaved && !prev.lastSaved) return true
  if (!incoming.lastSaved && prev.lastSaved) return false
  return stateRevision(incoming) !== stateRevision(prev)
}

export function stateRevision(state: AppState): string {
  const roster = state.students
    .slice(0, state.classSize)
    .map((student) => `${student.id}:${student.tally}:${student.name}`)
    .join('|')
  return `${state.classSize}:${state.lastSaved ?? ''}:${roster}`
}

export function loadState(): AppState {
  try {
    const raw = readRaw()
    if (!raw) {
      return normalizeState({
        students: createDefaultStudents(),
        classSize: DEFAULT_CLASS_SIZE,
        className: 'My Class',
        lastSaved: null,
      })
    }

    const parsed = JSON.parse(raw) as StoredPayload
    if (parsed.version !== STORAGE_VERSION || !parsed.state?.students?.length) {
      return normalizeState({
        students: createDefaultStudents(),
        classSize: DEFAULT_CLASS_SIZE,
        className: parsed.state?.className ?? 'My Class',
        lastSaved: null,
      })
    }

    return normalizeState(parsed.state)
  } catch {
    return normalizeState({
      students: createDefaultStudents(),
      classSize: DEFAULT_CLASS_SIZE,
      className: 'My Class',
      lastSaved: null,
    })
  }
}

export function saveState(state: AppState): AppState {
  const timestamp = new Date().toISOString()
  const nextState: AppState = { ...state, lastSaved: timestamp }

  const payload: StoredPayload = {
    version: STORAGE_VERSION,
    state: nextState,
  }

  writeRaw(JSON.stringify(payload))
  return nextState
}
