'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { ContentItem } from '@/lib/types'
import { format } from 'date-fns'

export function Card({ item, onClick }: { item: ContentItem; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
  }

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.preventDefault()
        onClick()
      }}
      className={
        'w-full text-left p-3 rounded-lg border bg-white hover:shadow-sm transition ' +
        (isDragging ? 'opacity-60 border-slate-400' : 'border-slate-200')
      }
    >
      <div className="font-medium leading-snug">{item.judul}</div>
      <div className="mt-1 text-xs text-slate-600 flex flex-wrap gap-x-2 gap-y-1">
        <span>{item.platform}</span>
        <span>•</span>
        <span>DL: {format(new Date(item.deadline + 'T00:00:00'), 'dd MMM')}</span>
      </div>
      <div className="mt-2 text-xs text-slate-500 truncate">PIC: {item.pic_email}</div>
      {item.status === 'Complete' && item.final_drive_link && (
        <div className="mt-2 text-xs text-emerald-700 truncate">Final: ada</div>
      )}
      {item.status === 'Complete' && !item.final_drive_link && (
        <div className="mt-2 text-xs text-rose-700 truncate">Final: belum diisi</div>
      )}
    </button>
  )
}
