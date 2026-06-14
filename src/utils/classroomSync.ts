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

let channel: BroadcastChannel | null = null

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

/** Push state to all other Monsterz contexts (main tab, PiP float, etc.). */
export function notifyClassroomSync(message: ClassroomSyncMessage): void {
  getChannel()?.postMessage(message)

  // BroadcastChannel can miss Document PiP in some builds — mirror via postMessage.
  if (window.opener && !window.opener.closed) {
    try {
      window.opener.postMessage(message, window.location.origin)
    } catch {
      /* ignore */
    }
  }

  const pipWindow = window.documentPictureInPicture?.window
  if (pipWindow && !pipWindow.closed) {
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
  let lastFingerprint = ''

  const deliver = (message: ClassroomSyncMessage) => {
    const fingerprint = `${message.sourceId}|${message.state.lastSaved}|${message.highlightStudentId ?? ''}`
    if (fingerprint === lastFingerprint) return
    lastFingerprint = fingerprint
    listener(message)
  }

  const onChannel = (event: MessageEvent<ClassroomSyncMessage>) => {
    if (isSyncMessage(event.data)) deliver(event.data)
  }

  const onPostMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return
    if (!isSyncMessage(event.data)) return

    const pipWindow = window.documentPictureInPicture?.window
    const fromPip = pipWindow != null && event.source === pipWindow
    const fromOpener = window.opener != null && event.source === window.opener
    if (!fromPip && !fromOpener) return

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
