import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { TipProvider } from './context/TipContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { DemoProvider } from './context/DemoContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <DemoProvider>
            <TipProvider>
              <App />
            </TipProvider>
          </DemoProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
