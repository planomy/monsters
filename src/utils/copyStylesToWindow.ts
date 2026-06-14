import floatCss from '../float.css?inline'
import { PIP_WINDOW_W } from './floatLayout'

const FLOAT_SHELL_CSS = `
  html.float-pip,
  html.float-pip body {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    height: 100% !important;
    overflow: hidden !important;
    background: #16121f !important;
  }

  #float-root {
    display: block;
    width: ${PIP_WINDOW_W}px;
    overflow: hidden;
  }
`

export function copyStylesToWindow(targetWindow: Window): void {
  const { document: targetDoc } = targetWindow
  const theme = window.document.documentElement.getAttribute('data-theme') ?? 'dark'

  targetDoc.documentElement.classList.add('float-pip')
  targetDoc.documentElement.setAttribute('data-theme', theme)
  targetDoc.documentElement.style.background = '#16121f'
  targetDoc.body.style.background = '#16121f'

  const base = targetDoc.createElement('base')
  base.href = new URL(import.meta.env.BASE_URL, window.location.href).href
  targetDoc.head.appendChild(base)

  document.querySelectorAll('link[rel="stylesheet"]').forEach((node) => {
    if (!(node instanceof HTMLLinkElement)) return
    const link = targetDoc.createElement('link')
    link.rel = 'stylesheet'
    link.href = node.href
    targetDoc.head.appendChild(link)
  })

  document.querySelectorAll('style').forEach((node) => {
    const style = targetDoc.createElement('style')
    style.textContent = node.textContent
    targetDoc.head.appendChild(style)
  })

  const shell = targetDoc.createElement('style')
  shell.id = 'float-shell'
  shell.textContent = FLOAT_SHELL_CSS
  targetDoc.head.appendChild(shell)

  const float = targetDoc.createElement('style')
  float.id = 'float-styles'
  float.textContent = floatCss
  targetDoc.head.appendChild(float)
}

export function waitForPiPStyles(targetWindow: Window): Promise<void> {
  const links = [...targetWindow.document.querySelectorAll('link[rel="stylesheet"]')]
  if (!links.length) return Promise.resolve()

  return Promise.all(
    links.map(
      (link) =>
        new Promise<void>((resolve) => {
          if (link instanceof HTMLLinkElement && link.sheet) {
            resolve()
            return
          }
          link.addEventListener('load', () => resolve(), { once: true })
          link.addEventListener('error', () => resolve(), { once: true })
        }),
    ),
  ).then(() => undefined)
}
