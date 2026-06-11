import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initTheme } from './hooks/useTheme'
import { initUiScale } from './hooks/useUiScale'
import './index.css'
import App from './App.tsx'

initTheme()
initUiScale()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
