'use client'

import { AuthProvider } from '@/lib/auth-context'
import { I18nProvider } from '@/lib/i18n-context'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { SettingsProvider } from '@/lib/settings-context'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { logsApi } from '@/lib/api'

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Global Error Listener for the 'bugs' folder
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      logsApi.post(event.error || { message: event.message }, `GlobalError:${window.location.pathname}`)
    }
    const handleRejection = (event: PromiseRejectionEvent) => {
      logsApi.post(event.reason || 'Unhandled Promise Rejection', `GlobalRejection:${window.location.pathname}`)
    }
    
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  const isSuperAdmin = pathname?.startsWith('/superadmin')

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <I18nProvider>
        <SettingsProvider>
          <AuthProvider>
            {children}
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </SettingsProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
