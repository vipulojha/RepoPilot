import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import KitApp from './KitApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <KitApp />
  </StrictMode>,
)
