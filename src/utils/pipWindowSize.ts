import { PIP_WINDOW_W } from './floatLayout'

export const PIP_PILL_SIZE = PIP_WINDOW_W
export const PIP_PANEL_WIDTH = PIP_WINDOW_W

export function resizePipWindow(pipWindow: Window, width: number, height: number): void {
  try {
    pipWindow.resizeTo(width, height)
  } catch {
    /* resizeTo requires a user gesture on the PiP window */
  }
}

/** Measure rendered float content height inside the PiP document. */
export function measureFloatContentHeight(pipWindow: Window): number {
  const root = pipWindow.document.getElementById('float-root')
  if (!root) return 0

  const grid = root.querySelector('.student-grid--float')
  const head = root.querySelector('.float-panel__head')
  const gridH = grid?.getBoundingClientRect().height ?? 0
  const headH = head?.getBoundingClientRect().height ?? 0

  if (gridH > 0) return Math.ceil(headH + gridH)
  return root.scrollHeight
}

/**
 * Resize PiP to fit content. Keeps the window's top-left fixed — no moveTo,
 * which avoids jumping to (0,0) when anchoring bottom-right from a top-left PiP.
 */
export function resizePipToContentHeight(
  pipWindow: Window,
  innerWidth: number,
  innerContentHeight: number,
): void {
  try {
    const top = pipWindow.screenY
    const left = pipWindow.screenX

    const chromeH = pipWindow.outerHeight - pipWindow.innerHeight
    const chromeW = pipWindow.outerWidth - pipWindow.innerWidth
    const outerW = innerWidth + chromeW
    let outerH = innerContentHeight + chromeH

    pipWindow.resizeTo(outerW, outerH)

    const deficit = innerContentHeight - pipWindow.innerHeight
    if (deficit > 0) {
      outerH = pipWindow.outerHeight + deficit
      pipWindow.resizeTo(outerW, outerH)
    }

    pipWindow.moveTo(left, top)
  } catch {
    resizePipWindow(pipWindow, innerWidth, innerContentHeight)
  }
}
