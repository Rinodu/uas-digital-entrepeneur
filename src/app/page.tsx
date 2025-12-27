'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

export default function Home() {
  const { session, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    router.replace(session ? '/board' : '/login')
  }, [loading, session, router])

  return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-sm text-slate-600">Mengalihkan…</div>
    </div>
  )
}
