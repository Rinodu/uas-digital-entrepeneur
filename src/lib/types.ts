export type Status = 'Not Started' | 'In Progress' | 'Complete'
export type Platform = 'Reels' | 'TikTok' | 'YT Shorts'

export type ContentItem = {
  id: string
  judul: string
  platform: Platform
  status: Status
  pic_email: string
  deadline: string // YYYY-MM-DD
  brief_request: string | null
  link_asset: string | null
  link_draft: string | null
  final_drive_link: string | null
  created_at: string
  updated_at: string
}

export type AuditLog = {
  id: number
  content_id: string
  changed_at: string
  changed_by: string | null
  field: string
  old_value: string | null
  new_value: string | null
}
