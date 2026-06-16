import type { AppState } from '../types'
import {
  FLOAT_SYNC_SOURCE,
  getLinkedMainWindow,
  MAIN_GET_STATE_KEY,
  MAIN_SYNC_SOURCE,
  PIP_APPLY_STATE_KEY,
  publishMainState,
  readPublishedMainState,
  type ClassroomStateMessage,
} from './classroomSync'
import { normalizeState } from './normalize'
import { loadState, loadStateFromWindow } from './storage'

export function registerMainStateAccessor(getState: () => AppState): () => void {
  ;(window as Window & { [MAIN_GET_STATE_KEY]?: () => AppState })[MAIN_GET_STATE_KEY] = getState
  return () => {
    delete (window as Window & { [MAIN_GET_STATE_KEY]?: () => AppState })[MAIN_GET_STATE_KEY]
  }
}

export function registerPipStateApplier(applyState: (state: AppState) => void): () => void {
  ;(window as Window & { [PIP_APPLY_STATE_KEY]?: (state: AppState) => void })[PIP_APPLY_STATE_KEY] =
    applyState
  return () => {
    delete (window as Window & { [PIP_APPLY_STATE_KEY]?: (state: AppState) => void })[
      PIP_APPLY_STATE_KEY
    ]
  }
}

export function readStateViaMainAccessor(main: Window): AppState | null {
  const getter = (main as Window & { [MAIN_GET_STATE_KEY]?: () => AppState })[MAIN_GET_STATE_KEY]
  if (!getter) return null
  try {
    return normalizeState(getter())
  } catch {
    return null
  }
}

/** Push roster to PiP — direct callback first, postMessage fallback. */
export function pushStateToPipWindow(state: AppState): void {
  publishMainState(state)

  const pip = window.documentPictureInPicture?.window
  if (!pip || pip.closed) return

  const apply = (pip as Window & { [PIP_APPLY_STATE_KEY]?: (state: AppState) => void })[
    PIP_APPLY_STATE_KEY
  ]
  if (apply) {
    try {
      apply(normalizeState(state))
      return
    } catch {
      /* fall through */
    }
  }

  const message: ClassroomStateMessage = {
    type: 'state',
    sourceId: MAIN_SYNC_SOURCE,
    state: normalizeState(state),
  }

  try {
    pip.postMessage(message, window.location.origin)
  } catch {
    /* ignore */
  }
}

/** PiP reads live roster from main tab. */
export function loadStateForContext(): AppState {
  const main = getLinkedMainWindow()
  if (main && !main.closed) {
    const fromAccessor = readStateViaMainAccessor(main)
    if (fromAccessor) return fromAccessor

    const published = readPublishedMainState(main)
    if (published) return normalizeState(published)

    const fromStorage = loadStateFromWindow(main)
    if (fromStorage) return fromStorage
  }

  return loadState()
}

export function requestFreshStateFromMain(): void {
  const main = getLinkedMainWindow()
  if (!main || main.closed) return

  const getter = (main as Window & { [MAIN_GET_STATE_KEY]?: () => AppState })[MAIN_GET_STATE_KEY]
  if (getter) {
    try {
      const apply = (window as Window & { [PIP_APPLY_STATE_KEY]?: (state: AppState) => void })[
        PIP_APPLY_STATE_KEY
      ]
      const fresh = normalizeState(getter())
      if (apply) {
        apply(fresh)
        return
      }
    } catch {
      /* fall through */
    }
  }

  const message = { type: 'request-state' as const, sourceId: FLOAT_SYNC_SOURCE }
  try {
    main.postMessage(message, window.location.origin)
  } catch {
    /* ignore */
  }
}
