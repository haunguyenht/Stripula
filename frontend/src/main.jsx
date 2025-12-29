import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import App from './App'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { TooltipProvider } from '@/components/ui/tooltip'
import { UserNotificationListener } from '@/components/notifications/UserNotificationListener'
import { initDevToolsProtection } from '@/lib/utils/devtools-protection'

// Initialize DevTools protection in production
initDevToolsProtection({
  disableRightClick: true,
  disableKeys: true,
  detectOpen: false, // Set to true for stricter detection (slight performance cost)
  disableTextSelect: false, // Keep false for better UX
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <UserNotificationListener />
          <App />
          <Toaster 
            position="bottom-right"
            toastOptions={{
              duration: 4000,
            }}
            gap={12}
            visibleToasts={4}
            expand={false}
            closeButton
          />
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
