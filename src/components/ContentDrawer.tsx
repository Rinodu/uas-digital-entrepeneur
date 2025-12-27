'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { AuditLog, ContentItem, Platform, Status } from '@/lib/types'
import { isValidDriveFileLink, normalizeUrl } from '@/lib/validate'
import { format } from 'date-fns'

const STATUS_OPTIONS: Status[] = ['Not Started', 'In Progress', 'Complete']
const PLATFORM_OPTIONS: Platform[] = ['Reels', 'TikTok', 'YT Shorts']

export function ContentDrawer(
  { open, item, onClose, userEmail, canCreateAny, onSaved }: {
    open: boolean
    item: ContentItem | null
    onClose: () => void
    userEmail: string
    canCreateAny: boolean
    onSaved: (updated: ContentItem) => void
  }
) {
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string|null>(null)
  const [audit, setAudit] = useState<AuditLog[]>([])
  const [loadingAudit, setLoadingAudit] = useState(false)

  const [form, setForm] = useState<Partial<ContentItem>>({})

  const isEditable = useMemo(() => {
    if (!item) return false
    if (canCreateAny) return true
    return item.pic_email === userEmail
  }, [item, userEmail, canCreateAny])

  useEffect(() => {
    setMsg(null)
    if (item) setForm(item)
  }, [item])

  useEffect(() => {
    let alive = true
    async function loadAudit() {
      if (!item) return
      setLoadingAudit(true)
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('content_id', item.id)
          .order('changed_at', { ascending: false })
          .limit(50)

        if (!alive) return
        if (error) {
          setAudit([])
          return
        }
        setAudit((data ?? []) as AuditLog[])
      } catch {
        if (!alive) return
        setAudit([])
      } finally {
        if (alive) setLoadingAudit(false)
      }
    }
    if (open && item) loadAudit()
    return () => {
      alive = false
    }
  }, [open, item?.id])

  if (!open || !item) return null

  async function save(patch?: Partial<ContentItem>) {
    if (!item) return

    setMsg(null)
    setSaving(true)
    try {
      const next = { ...form, ...(patch ?? {}) }

      const status = next.status as Status
      const finalLink = normalizeUrl(String(next.final_drive_link ?? ''))

      if (status === 'Complete') {
        if (!isValidDriveFileLink(finalLink)) {
          setMsg('Untuk Complete, Final Drive Link wajib diisi (link file Drive/Docs).')
          setSaving(false)
          return
        }
        next.final_drive_link = finalLink
      } else {
        // normalize if user filled link anyway
        if (finalLink) next.final_drive_link = finalLink
      }

      const { data, error } = await supabase
        .from('contents')
        .update({
          judul: next.judul,
          platform: next.platform,
          status: next.status,
          pic_email: next.pic_email,
          deadline: next.deadline,
          brief_request: next.brief_request,
          link_asset: next.link_asset,
          link_draft: next.link_draft,
          final_drive_link: next.final_drive_link,
        })
        .eq('id', item.id)
        .select('*')
        .single()

      if (error) throw error
      onSaved(data as ContentItem)
      setMsg('Tersimpan.')
    } catch (e: any) {
      setMsg(e?.message ?? 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  // keep UI simple: user changes Status then clicks Save.

  return (
    <div className="fixed inset-0 z-30">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white border-l border-slate-200 shadow-xl overflow-y-auto">
        <div className="p-4 border-b border-slate-200 flex items-start gap-2">
          <div className="flex-1">
            <div className="text-sm text-slate-500">Detail</div>
            <div className="text-lg font-semibold leading-snug">{item.judul}</div>
          </div>
          <button onClick={onClose} className="px-3 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-sm">
            Tutup
          </button>
        </div>

        <div className="p-4 space-y-3">
          {msg && (
            <div className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-md p-2">
              {msg}
            </div>
          )}

          <Field label="Judul">
            <input
              value={String(form.judul ?? '')}
              onChange={(e) => setForm((f) => ({ ...f, judul: e.target.value }))}
              disabled={!isEditable}
              className="w-full px-3 py-2 rounded-md border border-slate-300"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Platform">
              <select
                value={String(form.platform ?? 'Reels')}
                onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value as Platform }))}
                disabled={!isEditable}
                className="w-full px-3 py-2 rounded-md border border-slate-300"
              >
                {PLATFORM_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </Field>

            <Field label="Status">
              <select
                value={String(form.status ?? 'Not Started')}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Status }))}
                disabled={!isEditable}
                className="w-full px-3 py-2 rounded-md border border-slate-300"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Deadline">
              <input
                type="date"
                value={String(form.deadline ?? '')}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                disabled={!isEditable}
                className="w-full px-3 py-2 rounded-md border border-slate-300"
              />
            </Field>

            <Field label="PIC (email)">
              <input
                value={String(form.pic_email ?? '')}
                onChange={(e) => setForm((f) => ({ ...f, pic_email: e.target.value }))}
                disabled={!canCreateAny}
                className="w-full px-3 py-2 rounded-md border border-slate-300"
                placeholder="pic@email.com"
              />
              {!canCreateAny && (
                <div className="text-xs text-slate-500 mt-1">Hanya admin yang bisa mengubah PIC.</div>
              )}
            </Field>
          </div>

          <Field label="Brief / Request (opsional)">
            <textarea
              value={String(form.brief_request ?? '')}
              onChange={(e) => setForm((f) => ({ ...f, brief_request: e.target.value }))}
              disabled={!isEditable}
              className="w-full px-3 py-2 rounded-md border border-slate-300 min-h-[88px]"
            />
          </Field>

          {(String(form.status) === 'In Progress' || String(form.status) === 'Complete') && (
            <>
              <Field label="Link Asset (opsional)">
                <input
                  value={String(form.link_asset ?? '')}
                  onChange={(e) => setForm((f) => ({ ...f, link_asset: e.target.value }))}
                  disabled={!isEditable}
                  className="w-full px-3 py-2 rounded-md border border-slate-300"
                  placeholder="https://..."
                />
              </Field>
              <Field label="Link Draft (opsional)">
                <input
                  value={String(form.link_draft ?? '')}
                  onChange={(e) => setForm((f) => ({ ...f, link_draft: e.target.value }))}
                  disabled={!isEditable}
                  className="w-full px-3 py-2 rounded-md border border-slate-300"
                  placeholder="https://..."
                />
              </Field>
            </>
          )}

          {(String(form.status) === 'Complete') && (
            <Field label="Final Drive Link (WAJIB)">
              <input
                value={String(form.final_drive_link ?? '')}
                onChange={(e) => setForm((f) => ({ ...f, final_drive_link: e.target.value }))}
                disabled={!isEditable}
                className="w-full px-3 py-2 rounded-md border border-slate-300"
                placeholder="https://drive.google.com/file/d/..."
              />
              <div className="text-xs text-slate-500 mt-1">Harus link file Drive/Docs. Folder tidak diterima.</div>
            </Field>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => save()}
              disabled={!isEditable || saving}
              className="px-3 py-2 rounded-md text-sm bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Simpan
            </button>

            

            {item.final_drive_link && (
              <a
                href={item.final_drive_link}
                target="_blank"
                rel="noreferrer"
                className="ml-auto px-3 py-2 rounded-md text-sm bg-slate-100 hover:bg-slate-200"
              >
                Buka Final
              </a>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200">
            <div className="font-semibold mb-2">Riwayat Perubahan</div>
            {loadingAudit ? (
              <div className="text-sm text-slate-600">Memuat…</div>
            ) : audit.length === 0 ? (
              <div className="text-sm text-slate-600">Belum ada.</div>
            ) : (
              <div className="space-y-2">
                {audit.map((a) => (
                  <div key={a.id} className="text-sm bg-slate-50 border border-slate-200 rounded-md p-2">
                    <div className="text-xs text-slate-500">
                      {formatDateTimeSafe(a.changed_at)}
                    </div>
                    <div className="mt-1">
                      <span className="font-medium">{a.field}</span>: <span className="text-slate-600">{a.old_value ?? ''}</span> →{' '}
                      <span className="text-slate-900">{a.new_value ?? ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-slate-600">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  )
}

function formatDateTimeSafe(value: string) {
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return format(d, 'dd MMM yyyy HH:mm')
  } catch {
    return value
  }
}
