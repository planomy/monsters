import type { AppState } from '../types'

export const MAIN_SYNC_SOURCE = 'main-app'
export const FLOAT_SYNC_SOURCE = 'float-pip'

/** Set on the PiP window when opened so sync works even if `window.opener` is null. */
export const PIP_MAIN_WINDOW_KEY = '__monsterzMainWindow'

/** Latest roster on the main tab — PiP reads this when storage is partitioned. */
export const MAIN_PUBLISHED_STATE_KEY = '__monsterzPublishedState'

/** Main exposes live roster getter for PiP cross-window reads. */
export const MAIN_GET_STATE_KEY = '__monsterzGetState'

/** PiP exposes apply callback so main can push roster directly. */
export const PIP_APPLY_STATE_KEY = '__monsterzApplyState'

export interface ClassroomStateMessage {
  type: 'state'
  sourceId: string
  state: AppState
  highlightStudentId?: string
}

export interface ClassroomRequestStateMessage {
  type: 'request-state'
  sourceId: string
}

export type ClassroomSyncMessage = ClassroomStateMessage | ClassroomRequestStateMessage

const CHANNEL_NAME = 'monsterz-classroom-sync'

let channel: BroadcastChannel | null = null
let pipWindowRef: Window | null = null

function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME)
  return channel
}

function isStateMessage(data: unknown): data is ClassroomStateMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as ClassroomStateMessage).type === 'state' &&
    typeof (data as ClassroomStateMessage).sourceId === 'string' &&
    (data as ClassroomStateMessage).state != null
  )
}

function isRequestStateMessage(data: unknown): data is ClassroomRequestStateMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as ClassroomRequestStateMessage).type === 'request-state' &&
    typeof (data as ClassroomRequestStateMessage).sourceId === 'string'
  )
}

function isSyncMessage(data: unknown): data is ClassroomSyncMessage {
  return isStateMessage(data) || isRequestStateMessage(data)
}

export function getLinkedMainWindow(): Window | null {
  const tagged = (window as Window & { [PIP_MAIN_WINDOW_KEY]?: Window })[PIP_MAIN_WINDOW_KEY]
  if (tagged && !tagged.closed) return tagged
  if (window.opener && !window.opener.closed) return window.opener
  return null
}

function getPipWindow(): Window | null {
  if (pipWindowRef && !pipWindowRef.closed) return pipWindowRef
  const docPip = window.documentPictureInPicture?.window
  if (docPip && !docPip.closed) return docPip
  return null
}

export function registerPipWindow(pipWindow: Window | null): void {
  pipWindowRef = pipWindow
}

export function attachMainWindowToPip(pipWindow: Window, mainWindow: Window = window): void {
  ;(pipWindow as Window & { [PIP_MAIN_WINDOW_KEY]: Window })[PIP_MAIN_WINDOW_KEY] = mainWindow
  registerPipWindow(pipWindow)
}

export function publishMainState(state: AppState): void {
  ;(window as Window & { [MAIN_PUBLISHED_STATE_KEY]?: AppState })[MAIN_PUBLISHED_STATE_KEY] = state
}

export function readPublishedMainState(main: Window): AppState | null {
  const state = (main as Window & { [MAIN_PUBLISHED_STATE_KEY]?: AppState })[MAIN_PUBLISHED_STATE_KEY]
  return state ?? null
}

export function requestStateFromMain(): void {
  const main = getLinkedMainWindow()
  const message: ClassroomRequestStateMessage = {
    type: 'request-state',
    sourceId: FLOAT_SYNC_SOURCE,
  }

  getChannel()?.postMessage(message)

  if (main) {
    try {
      main.postMessage(message, window.location.origin)
    } catch {
      /* ignore */
    }
  }
}

/** Push state to all other Monsterz contexts (main tab, PiP float, etc.). */
export function notifyClassroomSync(message: ClassroomStateMessage): void {
  if (message.sourceId === MAIN_SYNC_SOURCE) {
    publishMainState(message.state)
  }

  getChannel()?.postMessage(message)

  const main = getLinkedMainWindow()
  if (main && main !== window) {
    try {
      main.postMessage(message, window.location.origin)
    } catch {
      /* ignore */
    }
  }

  const pipWindow = getPipWindow()
  if (pipWindow && pipWindow !== window) {
    try {
      pipWindow.postMessage(message, window.location.origin)
    } catch {
      /* ignore */
    }
  }
}

export function subscribeClassroomSync(
  listener: (message: ClassroomSyncMessage) => void,
): () => void {
  const deliver = (message: ClassroomSyncMessage) => {
    listener(message)
  }

  const onChannel = (event: MessageEvent<ClassroomSyncMessage>) => {
    if (isSyncMessage(event.data)) deliver(event.data)
  }

  const onPostMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return
    if (!isSyncMessage(event.data)) return
    if (event.source === window) return
    deliver(event.data)
  }

  const bus = getChannel()
  bus?.addEventListener('message', onChannel)
  window.addEventListener('message', onPostMessage)

  return () => {
    bus?.removeEventListener('message', onChannel)
    window.removeEventListener('message', onPostMessage)
  }
}

export function isDocumentPiPSupported(): boolean {
  return typeof window !== 'undefined' && 'documentPictureInPicture' in window
}
