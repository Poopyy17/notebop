import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StackProvider, StackTheme } from '@stackframe/react'
import { Toaster } from '@/components/ui/sonner'
import './index.css'
import App from './App.tsx'
import { BreadcrumbProvider } from './contexts/BreadcrumbContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { stackClientApp } from './stack'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <StackProvider app={stackClientApp}>
            <StackTheme>
              <ThemeProvider>
                <BreadcrumbProvider>
                  <App />
                  <Toaster position="top-right" />
                </BreadcrumbProvider>
              </ThemeProvider>
            </StackTheme>
          </StackProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </Suspense>
  </StrictMode>,
)
