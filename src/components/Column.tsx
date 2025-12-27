'use client'

import { useDroppable } from '@dnd-kit/core'
import type { ContentItem, Status } from '@/lib/types'
import { Card } from '@/components/Card'

export function Column(
  { status, items, onSelect }: {
    status: Status
    items: ContentItem[]
    onSelect: (id: string) => void
  }
) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div ref={setNodeRef} className={
      'rounded-xl border p-3 min-h-[160px] ' +
      (isOver ? 'border-slate-400 bg-slate-100' : 'border-slate-200 bg-slate-50')
    }>
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">{status}</div>
        <div className="text-xs text-slate-600">{items.length}</div>
      </div>
      <div className="space-y-2">
        {items.map((it) => (
          <Card key={it.id} item={it} onClick={() => onSelect(it.id)} />
        ))}
        {items.length === 0 && (
          <div className="text-sm text-slate-500 py-6 text-center">Kosong</div>
        )}
      </div>
    </div>
  )
}
