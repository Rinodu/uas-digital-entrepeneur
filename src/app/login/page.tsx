'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/components/AuthProvider'

export default function LoginPage() {
  const { session, loading } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin'|'signup'>('signin')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string|null>(null)

  useEffect(() => {
    if (!loading && session) router.replace('/board')
  }, [loading, session, router])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    setBusy(true)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.replace('/board')
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMsg('Akun dibuat. Silakan login.')
        setMode('signin')
      }
    } catch (err: any) {
      setMsg(err?.message ?? 'Gagal')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="text-lg font-semibold">Masuk</div>
        <div className="text-sm text-slate-600 mt-1">Email & password (Supabase Auth)</div>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div>
            <label className="text-xs text-slate-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="nama@email.com"
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="••••••••"
              required
            />
          </div>

          {msg && <div className="text-sm text-rose-600">{msg}</div>}

          <button
            type="submit"
            disabled={busy}
            className="w-full px-3 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {mode === 'signin' ? 'Masuk' : 'Buat akun'}
          </button>

          <div className="text-sm text-slate-600">
            {mode === 'signin' ? (
              <button type="button" className="underline" onClick={() => setMode('signup')}>
                Belum punya akun? Daftar
              </button>
            ) : (
              <button type="button" className="underline" onClick={() => setMode('signin')}>
                Sudah punya akun? Masuk
              </button>
            )}
          </div>
        </form>

        <div className="mt-5 text-xs text-slate-500">
          Catatan: role default = staff. Untuk admin, ubah di table <span className="font-mono">profiles</span> di Supabase.
        </div>
      </div>
    </div>
  )
}
