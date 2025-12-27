export function isValidDriveFileLink(url: string): boolean {
  const u = url.trim()
  if (!u) return false
  return u.includes('drive.google.com/file/d/') || u.includes('docs.google.com/')
}

export function normalizeUrl(url: string): string {
  return url.trim()
}
