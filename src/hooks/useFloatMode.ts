import { createElement, useCallback, useEffect, useRef, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { FloatController } from '../components/FloatController'
import { copyStylesToWindow, waitForPiPStyles } from '../utils/copyStylesToWindow'
import {
  attachMainWindowToPip,
  isDocumentPiPSupported,
  MAIN_SYNC_SOURCE,
  notifyClassroomSync,
  publishMainState,
  registerPipWindow,
} from '../utils/classroomSync'
import { pipPillWindowHeight } from '../utils/floatLayout'
import { PIP_PILL_SIZE } from '../utils/pipWindowSize'
import { activateEmbeddedStorage, loadState } from '../utils/storage'
import { pushStateToPipWindow } from '../utils/floatBridge'

const UNSUPPORTED_MESSAGE = 'Float Mode works in Chrome or Edge.'

export function useFloatMode() {
  const pipRootRef = useRef<Root | null>(null)
  const pipWindowRef = useRef<Window | null>(null)
  const [active, setActive] = useState(false)
  const supported = isDocumentPiPSupported()

  const cleanupPip = useCallback(() => {
    pipRootRef.current?.unmount()
    pipRootRef.current = null
    pipWindowRef.current = null
    registerPipWindow(null)
    setActive(false)
  }, [])

  const openFloatMode = useCallback(async () => {
    if (!supported) {
      window.alert(UNSUPPORTED_MESSAGE)
      return
    }

    await activateEmbeddedStorage()

    const docPip = window.documentPictureInPicture
    if (!docPip) {
      window.alert(UNSUPPORTED_MESSAGE)
      return
    }

    if (docPip.window && !docPip.window.closed) {
      pipRootRef.current?.unmount()
      pipRootRef.current = null
      pipWindowRef.current = null
      docPip.window.close()
      setActive(false)
    }

    try {
      const pipWindow = await docPip.requestWindow({
        width: PIP_PILL_SIZE,
        height: pipPillWindowHeight(),
        preferInitialWindowPlacement: false,
        disallowReturnToOpener: true,
      })

      pipWindow.document.title = 'Monsterz Float'
      pipWindowRef.current = pipWindow
      attachMainWindowToPip(pipWindow)
      publishMainState(loadState())
      copyStylesToWindow(pipWindow)
      await waitForPiPStyles(pipWindow)

      const mount = pipWindow.document.createElement('div')
      mount.id = 'float-root'
      pipWindow.document.body.appendChild(mount)

      pipRootRef.current = createRoot(mount)
      pipRootRef.current.render(createElement(FloatController, { pipWindow }))

      requestAnimationFrame(() => {
        pushStateToPipWindow(loadState())
      })

      notifyClassroomSync({
        type: 'state',
        sourceId: MAIN_SYNC_SOURCE,
        state: loadState(),
      })

      const handlePageHide = () => cleanupPip()
      pipWindow.addEventListener('pagehide', handlePageHide)

      setActive(true)
    } catch {
      window.alert(UNSUPPORTED_MESSAGE)
      cleanupPip()
    }
  }, [cleanupPip, supported])

  useEffect(() => {
    const syncActive = () => {
      const docPip = window.documentPictureInPicture
      if (!docPip?.window || docPip.window.closed) cleanupPip()
    }

    window.addEventListener('focus', syncActive)
    return () => window.removeEventListener('focus', syncActive)
  }, [cleanupPip])

  return {
    supported,
    active,
    openFloatMode,
    closeFloatMode: cleanupPip,
    unsupportedMessage: UNSUPPORTED_MESSAGE,
  }
}
