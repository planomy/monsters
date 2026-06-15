import { createDefaultStudents, DEFAULT_CLASS_SIZE } from '../data/defaults'
import { createDefaultPoll } from '../data/pollDefaults'
import type { AppState, MorningPollState } from '../types'
import { normalizeState } from './normalize'
import { loadPoll, normalizePoll, savePoll } from './pollStorage'
import { loadState, saveState } from './storage'

export const CLASS_LIBRARY_STORAGE_KEY = 'monsterz-class-library'
const LIBRARY_VERSION = 1

export interface SavedClass {
  id: string
  name: string
  appState: AppState
  poll: MorningPollState
  updatedAt: string
}

export interface ClassLibrary {
  version: typeof LIBRARY_VERSION
  activeId: string
  classes: SavedClass[]
}

export function createClassId(): string {
  return `class-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`}`
}

function readLibrary(): ClassLibrary | null {
  try {
    const raw = localStorage.getItem(CLASS_LIBRARY_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ClassLibrary
    if (parsed.version !== LIBRARY_VERSION || !parsed.classes?.length || !parsed.activeId) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function writeClassLibrary(library: ClassLibrary): void {
  try {
    localStorage.setItem(CLASS_LIBRARY_STORAGE_KEY, JSON.stringify(library))
  } catch {
    /* ignore */
  }
}

export function loadClassLibrary(): ClassLibrary {
  const existing = readLibrary()
  if (existing) return existing

  const appState = normalizeState(loadState())
  const poll = loadPoll()
  const id = createClassId()
  const library: ClassLibrary = {
    version: LIBRARY_VERSION,
    activeId: id,
    classes: [
      {
        id,
        name: appState.className.trim() || 'My Class',
        appState,
        poll,
        updatedAt: new Date().toISOString(),
      },
    ],
  }
  writeClassLibrary(library)
  return library
}

export function upsertActiveClass(
  library: ClassLibrary,
  appState: AppState,
  poll: MorningPollState,
): ClassLibrary {
  const normalized = normalizeState(appState)
  const now = new Date().toISOString()
  const displayName = normalized.className.trim() || 'My Class'

  return {
    ...library,
    classes: library.classes.map((entry) =>
      entry.id === library.activeId
        ? { ...entry, name: displayName, appState: normalized, poll, updatedAt: now }
        : entry,
    ),
  }
}

export function switchActiveClass(
  library: ClassLibrary,
  targetId: string,
  currentAppState: AppState,
  currentPoll: MorningPollState,
): { library: ClassLibrary; appState: AppState; poll: MorningPollState } | null {
  if (targetId === library.activeId) return null

  const target = library.classes.find((entry) => entry.id === targetId)
  if (!target) return null

  const nextLibrary: ClassLibrary = {
    ...upsertActiveClass(library, currentAppState, currentPoll),
    activeId: targetId,
  }

  const appState = normalizeState(target.appState)
  const poll = target.poll

  writeClassLibrary(nextLibrary)
  saveState(appState)
  savePoll(poll)

  return { library: nextLibrary, appState, poll }
}

export function addNewClass(
  library: ClassLibrary,
  currentAppState: AppState,
  currentPoll: MorningPollState,
  className: string,
): { library: ClassLibrary; appState: AppState; poll: MorningPollState } {
  const savedCurrent = upsertActiveClass(library, currentAppState, currentPoll)
  const id = createClassId()
  const trimmedName = className.trim() || 'New Class'
  const appState = normalizeState({
    className: trimmedName,
    students: createDefaultStudents(),
    classSize: DEFAULT_CLASS_SIZE,
    lastSaved: null,
  })
  const poll = createDefaultPoll()

  const nextLibrary: ClassLibrary = {
    ...savedCurrent,
    activeId: id,
    classes: [
      ...savedCurrent.classes,
      {
        id,
        name: trimmedName,
        appState,
        poll,
        updatedAt: new Date().toISOString(),
      },
    ],
  }

  writeClassLibrary(nextLibrary)
  saveState(appState)
  savePoll(poll)

  return { library: nextLibrary, appState, poll }
}

export function deleteSavedClass(
  library: ClassLibrary,
  classId: string,
  currentAppState: AppState,
  currentPoll: MorningPollState,
): { library: ClassLibrary; appState?: AppState; poll?: MorningPollState } | null {
  if (library.classes.length <= 1) return null

  const savedCurrent = upsertActiveClass(library, currentAppState, currentPoll)
  const remaining = savedCurrent.classes.filter((entry) => entry.id !== classId)
  if (remaining.length === savedCurrent.classes.length) return null

  if (classId !== library.activeId) {
    const nextLibrary = { ...savedCurrent, classes: remaining }
    writeClassLibrary(nextLibrary)
    return { library: nextLibrary }
  }

  const fallback = remaining[0]
  const nextLibrary: ClassLibrary = {
    ...savedCurrent,
    activeId: fallback.id,
    classes: remaining,
  }
  const appState = normalizeState(fallback.appState)
  const poll = fallback.poll

  writeClassLibrary(nextLibrary)
  saveState(appState)
  savePoll(poll)

  return { library: nextLibrary, appState, poll }
}

export function renameSavedClass(
  library: ClassLibrary,
  classId: string,
  currentAppState: AppState,
  currentPoll: MorningPollState,
  newName: string,
): { library: ClassLibrary; appState?: AppState } | null {
  const trimmedName = newName.trim()
  if (!trimmedName) return null

  const savedCurrent = upsertActiveClass(library, currentAppState, currentPoll)
  if (!savedCurrent.classes.some((entry) => entry.id === classId)) return null

  const now = new Date().toISOString()
  const nextLibrary: ClassLibrary = {
    ...savedCurrent,
    classes: savedCurrent.classes.map((entry) =>
      entry.id === classId
        ? {
            ...entry,
            name: trimmedName,
            appState: normalizeState({ ...entry.appState, className: trimmedName }),
            updatedAt: now,
          }
        : entry,
    ),
  }

  writeClassLibrary(nextLibrary)

  if (classId === library.activeId) {
    const appState = normalizeState({ ...currentAppState, className: trimmedName })
    saveState(appState)
    return { library: nextLibrary, appState }
  }

  return { library: nextLibrary }
}

export function duplicateSavedClass(
  library: ClassLibrary,
  sourceId: string,
  currentAppState: AppState,
  currentPoll: MorningPollState,
  newName: string,
): { library: ClassLibrary; appState: AppState; poll: MorningPollState } | null {
  const savedCurrent = upsertActiveClass(library, currentAppState, currentPoll)
  const source = savedCurrent.classes.find((entry) => entry.id === sourceId)
  if (!source) return null

  const trimmedName = newName.trim() || `${source.name} copy`
  const id = createClassId()
  const appState = normalizeState({
    ...structuredClone(source.appState),
    className: trimmedName,
    lastSaved: null,
  })
  const poll = normalizePoll(structuredClone(source.poll))

  const nextLibrary: ClassLibrary = {
    ...savedCurrent,
    activeId: id,
    classes: [
      ...savedCurrent.classes,
      {
        id,
        name: trimmedName,
        appState,
        poll,
        updatedAt: new Date().toISOString(),
      },
    ],
  }

  writeClassLibrary(nextLibrary)
  saveState(appState)
  savePoll(poll)

  return { library: nextLibrary, appState, poll }
}
