'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

type Role = 'admin' | 'staff'

type AuthState = {
  session: Session | null
  user: User | null
  role: Role
  loading: boolean
  error: string | null
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthState | null>(null)

async function fetchRole(userId: string | null | undefined): Promise<Role> {
  if (!userId) return 'staff'
  // IMPORTANT: always scope by current user id.
  // Without this, admins will get "multiple rows" errors.
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (error) return 'staff'
  const r = (data?.role as Role | null) ?? 'staff'
  return r === 'admin' ? 'admin' : 'staff'
}

async function fetchRoleWithTimeout(userId: string, ms = 2500): Promise<Role> {
  // Never block UI on role fetch.
  return await Promise.race<Role>([
    fetchRole(userId),
    new Promise<Role>((resolve) => setTimeout(() => resolve('staff'), ms)),
  ])
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<Role>('staff')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function doSignOut() {
    // Make logout feel instant and avoid UI getting stuck.
    setLoading(true)
    setError(null)
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } finally {
      setSession(null)
      setUser(null)
      setRole('staff')
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true

    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error: err } = await supabase.auth.getSession()
        if (!mounted) return

        const sess = data.session ?? null
        setSession(sess)
        setUser(sess?.user ?? null)
        setLoading(false) // ✅ never block UI

        if (sess?.user?.id) {
          fetchRoleWithTimeout(sess.user.id)
            .then((r) => mounted && setRole(r))
            .catch(() => mounted && setRole('staff'))
        } else {
          setRole('staff')
        }

        if (err) {
          setError(err.message)
        }
      } catch (e: any) {
        if (!mounted) return
        setSession(null)
        setUser(null)
        setRole('staff')
        setError(e?.message ?? 'Auth init failed')
        setLoading(false)
      }
    })()

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return
      setSession(newSession)
      setUser(newSession?.user ?? null)
      setLoading(false)

      if (newSession?.user?.id) {
        fetchRoleWithTimeout(newSession.user.id)
          .then((r) => mounted && setRole(r))
          .catch(() => mounted && setRole('staff'))
      } else {
        setRole('staff')
      }
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      session,
      user,
      role,
      loading,
      error,
      signOut: doSignOut,
    }),
    [session, user, role, loading, error]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used within AuthProvider')
  return v
}
