import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import App from './App'
import { ThemeProvider } from './contexts/ThemeContext'
import { TooltipProvider } from '@/components/ui/tooltip'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <TooltipProvider>
        <App />
        <Toaster 
          position="bottom-right"
          toastOptions={{
            className: 'font-sans',
            duration: 4000,
            classNames: {
              toast: 'opux-toast',
              title: 'opux-toast-title',
              description: 'opux-toast-description',
              success: 'opux-toast-success',
              error: 'opux-toast-error',
              warning: 'opux-toast-warning',
              info: 'opux-toast-info',
              closeButton: 'opux-toast-close',
            },
          }}
          richColors
          closeButton
        />
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>,
)
