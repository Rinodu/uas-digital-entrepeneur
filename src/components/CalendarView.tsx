'use client'

import { useMemo, useState } from 'react'
import { addMonths, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from 'date-fns'
import type { ContentItem } from '@/lib/types'
import { ContentDrawer } from '@/components/ContentDrawer'
import { useAuth } from '@/components/AuthProvider'

export function CalendarView({ items, loading }: { items: ContentItem[]; loading: boolean }) {
  const { user, role } = useAuth()
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const itemsByDay = useMemo(() => {
    const map = new Map<string, ContentItem[]>()
    for (const it of items) {
      const key = it.deadline
      const list = map.get(key) ?? []
      list.push(it)
      map.set(key, list)
    }
    return map
  }, [items])

  const gridDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
    const days: Date[] = []
    let d = start
    while (d <= end) {
      days.push(d)
      d = new Date(d.getTime() + 24 * 60 * 60 * 1000)
    }
    return days
  }, [month])

  const selectedItems = useMemo(() => {
    if (!selectedDate) return []
    const key = format(selectedDate, 'yyyy-MM-dd')
    return itemsByDay.get(key) ?? []
  }, [selectedDate, itemsByDay])

  const selected = useMemo(() => items.find((i) => i.id === selectedId) ?? null, [items, selectedId])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
            <button
              className="px-3 py-2 rounded-md text-sm bg-slate-100 hover:bg-slate-200"
              onClick={() => setMonth((m) => subMonths(m, 1))}
            >
              ←
            </button>
            <div className="font-semibold">{format(month, 'MMMM yyyy')}</div>
            <button
              className="px-3 py-2 rounded-md text-sm bg-slate-100 hover:bg-slate-200"
              onClick={() => setMonth((m) => addMonths(m, 1))}
            >
              →
            </button>
            <button
              className="ml-auto px-3 py-2 rounded-md text-sm bg-slate-100 hover:bg-slate-200"
              onClick={() => {
                setMonth(startOfMonth(new Date()))
                setSelectedDate(new Date())
              }}
            >
              Hari ini
            </button>
          </div>

          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
            {['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map((d) => (
              <div key={d} className="px-3 py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {gridDays.map((d) => {
              const key = format(d, 'yyyy-MM-dd')
              const count = (itemsByDay.get(key) ?? []).length
              const inMonth = isSameMonth(d, month)
              const active = selectedDate && isSameDay(d, selectedDate)
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(d)}
                  className={
                    'h-20 sm:h-24 px-2 py-2 border-b border-r border-slate-100 text-left align-top ' +
                    (inMonth ? 'bg-white' : 'bg-slate-50 text-slate-400') +
                    (active ? ' ring-2 ring-slate-700 ring-inset' : '')
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium">{format(d, 'd')}</div>
                    {count > 0 && (
                      <div className="text-xs px-2 py-0.5 rounded-full bg-slate-900 text-white">
                        {count}
                      </div>
                    )}
                  </div>
                  {count > 0 && (
                    <div className="mt-2 text-xs text-slate-600 line-clamp-2">
                      {(itemsByDay.get(key) ?? []).slice(0, 2).map((it) => it.judul).join(' • ')}
                      {(itemsByDay.get(key) ?? []).length > 2 ? ' …' : ''}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {loading && <div className="text-sm text-slate-600 mt-3">Memuat data…</div>}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="font-semibold">{selectedDate ? format(selectedDate, 'dd MMM yyyy') : 'Klik tanggal'}</div>
        <div className="text-sm text-slate-600 mt-1">Konten dengan deadline di tanggal ini.</div>

        <div className="mt-3 space-y-2">
          {selectedItems.length === 0 ? (
            <div className="text-sm text-slate-600">Tidak ada.</div>
          ) : (
            selectedItems.map((it) => (
              <button
                key={it.id}
                onClick={() => setSelectedId(it.id)}
                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50"
              >
                <div className="font-medium">{it.judul}</div>
                <div className="mt-1 text-xs text-slate-600">{it.platform} • PIC: {it.pic_email}</div>
                {it.brief_request && <div className="mt-1 text-xs text-slate-500 line-clamp-2">{it.brief_request}</div>}
              </button>
            ))
          )}
        </div>
      </div>

      <ContentDrawer
        open={!!selected}
        item={selected}
        onClose={() => setSelectedId(null)}
        userEmail={user?.email ?? ''}
        canCreateAny={role === 'admin'}
        onSaved={(_updated) => {
          // Kalender tidak melakukan reload sendiri; user bisa refresh di header.
        }}
      />
    </div>
  )
}
