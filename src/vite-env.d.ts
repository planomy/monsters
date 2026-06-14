/// <reference types="vite/client" />

interface DocumentPictureInPicture {
  window: Window | null
  requestWindow(options?: {
    width?: number
    height?: number
    preferInitialWindowPlacement?: boolean
    disallowReturnToOpener?: boolean
  }): Promise<Window>
}

interface Window {
  documentPictureInPicture?: DocumentPictureInPicture
}
