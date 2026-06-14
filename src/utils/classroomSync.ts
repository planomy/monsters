import type { AppState } from '../types'

export const MAIN_SYNC_SOURCE = 'main-app'
export const FLOAT_SYNC_SOURCE = 'float-pip'

export interface ClassroomSyncMessage {
  type: 'state'
  sourceId: string
  state: AppState
  highlightStudentId?: string
}

const CHANNEL_NAME = 'monsterz-classroom-sync'

/** Set on the PiP window when opened so sync works even if `window.opener` is null. */
export const PIP_MAIN_WINDOW_KEY = '__monsterzMainWindow'

let channel: BroadcastChannel | null = null
let pipWindowRef: Window | null = null

function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME)
  return channel
}

function isSyncMessage(data: unknown): data is ClassroomSyncMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as ClassroomSyncMessage).type === 'state' &&
    typeof (data as ClassroomSyncMessage).sourceId === 'string' &&
    (data as ClassroomSyncMessage).state != null
  )
}

function getMainWindow(): Window | null {
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

/** Push state to all other Monsterz contexts (main tab, PiP float, etc.). */
export function notifyClassroomSync(message: ClassroomSyncMessage): void {
  getChannel()?.postMessage(message)

  const main = getMainWindow()
  if (main) {
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
