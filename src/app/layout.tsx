import type { Metadata } from 'next'
import '@/styles/globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import { RequireAuth } from '@/components/RequireAuth'

export const metadata: Metadata = {
  title: 'Content Tracker',
  description: 'Kanban + Calendar seperti AppSheet',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          <RequireAuth>{children}</RequireAuth>
        </AuthProvider>
      </body>
    </html>
  )
}
