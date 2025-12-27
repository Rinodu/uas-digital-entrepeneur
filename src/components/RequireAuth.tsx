'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading, error } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !session && pathname !== '/login') {
      router.replace('/login')
    }
  }, [loading, session, pathname, router])

  if (pathname === '/login') return <>{children}</>
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-sm text-slate-600">Memuat sesi…</div>
      </div>
    )
  }

  if (error && !session) {
    return (
      <div className="min-h-screen grid place-items-center px-4">
        <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl p-4">
          <div className="font-semibold">Gagal memuat sesi</div>
          <div className="mt-1 text-sm text-slate-600 break-words">{error}</div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => router.replace('/login')}
              className="px-3 py-2 rounded-md text-sm bg-slate-900 text-white hover:bg-slate-800"
            >
              Buka Login
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-2 rounded-md text-sm bg-slate-100 hover:bg-slate-200"
            >
              Reload
            </button>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Biasanya ini karena <span className="font-mono">NEXT_PUBLIC_SUPABASE_URL</span>/<span className="font-mono">ANON_KEY</span> salah atau URL Configuration di Supabase belum menambahkan <span className="font-mono">http://localhost:3000</span>.
          </div>
        </div>
      </div>
    )
  }
  if (!session) return null

  return <>{children}</>
}
