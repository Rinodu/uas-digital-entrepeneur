'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Platform } from '@/lib/types'

const PLATFORM_OPTIONS: Platform[] = ['Reels', 'TikTok', 'YT Shorts']

export function NewContentModal(
  { open, onClose, userEmail, canCreateAny, onCreated }: {
    open: boolean
    onClose: () => void
    userEmail: string
    canCreateAny: boolean
    onCreated: () => Promise<void>
  }
) {
  const [judul, setJudul] = useState('')
  const [platform, setPlatform] = useState<Platform>('Reels')
  const [deadline, setDeadline] = useState('')
  const [pic, setPic] = useState(userEmail)
  const [brief, setBrief] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string|null>(null)

  if (!open) return null

  async function create() {
    setMsg(null)
    setBusy(true)
    try {
      const { error } = await supabase.from('contents').insert({
        judul,
        platform,
        status: 'Not Started',
        pic_email: canCreateAny ? pic : userEmail,
        deadline,
        brief_request: brief || null,
      })
      if (error) throw error
      setJudul('')
      setDeadline('')
      setBrief('')
      setPic(userEmail)
      await onCreated()
    } catch (e: any) {
      setMsg(e?.message ?? 'Gagal membuat')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-x-0 top-12 mx-auto w-[calc(100%-2rem)] max-w-lg bg-white border border-slate-200 rounded-xl shadow-xl p-4">
        <div className="flex items-center gap-2">
          <div className="text-lg font-semibold">Konten Baru</div>
          <button onClick={onClose} className="ml-auto px-3 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-sm">Tutup</button>
        </div>

        {msg && <div className="mt-3 text-sm text-rose-600">{msg}</div>}

        <div className="mt-3 space-y-3">
          <div>
            <div className="text-xs text-slate-600">Judul</div>
            <input
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-300"
              placeholder="Judul konten"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-slate-600">Platform</div>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Platform)}
                className="mt-1 w-full px-3 py-2 rounded-md border border-slate-300"
              >
                {PLATFORM_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <div className="text-xs text-slate-600">Deadline</div>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-md border border-slate-300"
              />
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-600">PIC (email)</div>
            <input
              value={canCreateAny ? pic : userEmail}
              onChange={(e) => setPic(e.target.value)}
              disabled={!canCreateAny}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-300 disabled:bg-slate-50"
              placeholder="pic@email.com"
            />
            {!canCreateAny && <div className="text-xs text-slate-500 mt-1">Staff hanya bisa membuat untuk dirinya sendiri.</div>}
          </div>

          <div>
            <div className="text-xs text-slate-600">Brief/Request (opsional)</div>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-300 min-h-[90px]"
              placeholder="Catatan ide / request"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={create}
              disabled={busy || !judul || !deadline}
              className="px-3 py-2 rounded-md text-sm bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Buat
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-md text-sm bg-slate-100 hover:bg-slate-200"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
