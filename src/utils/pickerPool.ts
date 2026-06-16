import { loadClassLibrary } from './classLibrary'

const STORAGE_KEY = 'monsterz-picker-pool'

interface PickerPoolStore {
  classId: string
  pool: string[]
}

function readStore(): PickerPoolStore | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PickerPoolStore
    if (typeof parsed.classId !== 'string' || !Array.isArray(parsed.pool)) return null
    return parsed
  } catch {
    return null
  }
}

function writeStore(store: PickerPoolStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    /* ignore */
  }
}

export function getActiveClassId(): string {
  return loadClassLibrary().activeId
}

export function loadPickerPool(classId = getActiveClassId()): string[] {
  const store = readStore()
  if (!store || store.classId !== classId) return []
  return store.pool
}

export function savePickerPool(pool: string[], classId = getActiveClassId()): void {
  writeStore({ classId, pool })
}

export function resetPickerPool(classId = getActiveClassId()): void {
  savePickerPool([], classId)
}
