'use client'

import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { CalendarView } from '@/components/CalendarView'
import { supabase } from '@/lib/supabaseClient'
import type { ContentItem, Status } from '@/lib/types'

const STATUS_OPTIONS: Status[] = ['Not Started', 'In Progress', 'Complete']

export default function CalendarPage() {
  const [status, setStatus] = useState<Status>('Not Started')
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load(s: Status) {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('contents')
        .select('*')
        .eq('status', s)
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
    load(status)
  }, [status])

  return (
    <AppShell>
      <div className="flex items-center gap-3 mb-3">
        <div>
          <div className="text-xl font-semibold">Calendar</div>
          <div className="text-sm text-slate-600">Event utama: Deadline (filter 1 status)</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className="px-3 py-2 rounded-md border border-slate-300 bg-white text-sm"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={() => load(status)}
            className="px-3 py-2 rounded-md text-sm bg-slate-100 hover:bg-slate-200"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="text-sm text-rose-600 mb-2">{error}</div>}
      <CalendarView items={items} loading={loading} />
    </AppShell>
  )
}
