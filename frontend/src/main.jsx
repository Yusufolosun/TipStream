import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { TipProvider } from './context/TipContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <TipProvider>
        <App />
      </TipProvider>
    </ErrorBoundary>
  </StrictMode>,
)
