'use client'

import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { NotificationProvider } from '@/components/NotificationToast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Footer } from '@/components/layout/Footer'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NotificationProvider>
          <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
            {children}
            <Footer />
          </div>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
