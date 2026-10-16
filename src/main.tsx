import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { iniciarAnaliticas } from './lib/analiticas'
import { borrarSesionGuardadaEnElNavegador } from './api/sesion'

iniciarAnaliticas()
borrarSesionGuardadaEnElNavegador()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
