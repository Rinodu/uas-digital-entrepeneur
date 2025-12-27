'use client'

import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { Board } from '@/components/Board'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabaseClient'
import type { ContentItem } from '@/lib/types'

export default function BoardPage() {
  const { user, role } = useAuth()
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('contents')
        .select('*')
        .order('deadline', { ascending: true })

      if (err) {
        setError(err.message)
        setItems([])
      } else {
        setItems((data ?? []) as ContentItem[])
      }
    } catch (e: any) {
      setError(e?.message ?? 'Gagal memuat data')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const canCreateAny = role === 'admin'

  return (
    <AppShell>
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div>
              <div className="text-xl font-semibold">Board</div>
              <div className="text-sm text-slate-600">Not Started → In Progress → Complete</div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={load}
                className="px-3 py-2 rounded-md text-sm bg-slate-100 hover:bg-slate-200"
              >
                Refresh
              </button>
            </div>
          </div>

          {error && <div className="text-sm text-rose-600 mb-2">{error}</div>}
          <Board
            items={items}
            setItems={setItems}
            userEmail={user?.email ?? ''}
            canCreateAny={canCreateAny}
            onReload={load}
            loading={loading}
          />
        </div>
      </div>
    </AppShell>
  )
}
