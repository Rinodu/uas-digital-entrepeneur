'use client'

import { closestCorners, DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { ContentItem, Status } from '@/lib/types'
import { isValidDriveFileLink } from '@/lib/validate'
import { Column } from '@/components/Column'
import { ContentDrawer } from '@/components/ContentDrawer'
import { NewContentModal } from '@/components/NewContentModal'

const STATUSES: Status[] = ['Not Started', 'In Progress', 'Complete']

export function Board(
  {
    items,
    setItems,
    userEmail,
    canCreateAny,
    onReload,
    loading,
  }: {
    items: ContentItem[]
    // React state setter supports value OR functional update.
    setItems: Dispatch<SetStateAction<ContentItem[]>>
    userEmail: string
    canCreateAny: boolean
    onReload: () => Promise<void>
    loading: boolean
  }
) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  // Avoid stale closures in async handlers.
  const itemsRef = useRef<ContentItem[]>(items)
  useEffect(() => {
    itemsRef.current = items
  }, [items])

  // Prevent double updates per card (drag spam).
  const inFlightRef = useRef<Record<string, boolean>>({})

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const selected = useMemo(() => items.find((i) => i.id === selectedId) ?? null, [items, selectedId])

  const byStatus = useMemo(() => {
    const map: Record<string, ContentItem[]> = {
      'Not Started': [],
      'In Progress': [],
      'Complete': [],
    }
    for (const it of items) map[it.status].push(it)
    return map as Record<Status, ContentItem[]>
  }, [items])

  async function updateItem(id: string, patch: Partial<ContentItem>) {
    const { error } = await supabase.from('contents').update(patch).eq('id', id)
    if (error) throw error
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const id = String(active.id)
    const targetStatus = String(over.id) as Status
    if (!STATUSES.includes(targetStatus)) return

    if (inFlightRef.current[id]) return

    const snapshot = itemsRef.current
    const item = snapshot.find((i) => i.id === id)
    if (!item) return
    if (item.status === targetStatus) return

    // UI validation before hitting DB constraint
    if (targetStatus === 'Complete') {
      const link = item.final_drive_link ?? ''
      if (!isValidDriveFileLink(link)) {
        setSelectedId(id)
        // Drawer will prompt user to input Final link then retry
        return
      }
    }

    // optimistic update
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: targetStatus } : it)))

    try {
      inFlightRef.current[id] = true
      await updateItem(id, { status: targetStatus })
    } catch (e: any) {
      // rollback
      setItems(snapshot)
      alert(e?.message ?? 'Gagal update status')
    } finally {
      inFlightRef.current[id] = false
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setShowNew(true)}
          className="px-3 py-2 rounded-md text-sm bg-slate-900 text-white hover:bg-slate-800"
        >
          + Konten Baru
        </button>
        {loading && <div className="text-sm text-slate-500">Memuat…</div>}
      </div>

      <DndContext
        sensors={sensors}
        onDragEnd={handleDragEnd}
        collisionDetection={closestCorners}
        modifiers={[restrictToWindowEdges]}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {STATUSES.map((s) => (
            <Column
              key={s}
              status={s}
              items={byStatus[s]}
              onSelect={(id) => setSelectedId(id)}
            />
          ))}
        </div>
      </DndContext>

      <ContentDrawer
        open={!!selected}
        item={selected}
        onClose={() => setSelectedId(null)}
        userEmail={userEmail}
        canCreateAny={canCreateAny}
        onSaved={async (updated) => {
          setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)))
          await onReload()
        }}
      />

      <NewContentModal
        open={showNew}
        onClose={() => setShowNew(false)}
        userEmail={userEmail}
        canCreateAny={canCreateAny}
        onCreated={async () => {
          setShowNew(false)
          await onReload()
        }}
      />
    </div>
  )
}
