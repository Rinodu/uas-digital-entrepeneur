'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import clsx from 'clsx'
import { useAuth } from '@/components/AuthProvider'

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname()
  const active = pathname === href
  return (
    <Link
      href={href}
      className={clsx(
        'px-3 py-2 rounded-md text-sm font-medium',
        active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-200'
      )}
    >
      {label}
    </Link>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, role, signOut } = useAuth()
  const router = useRouter()

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="font-semibold text-slate-900">Content Tracker</div>
          <nav className="flex items-center gap-2 ml-2">
            <NavLink href="/board" label="Board" />
            <NavLink href="/calendar" label="Calendar" />
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:block text-xs text-slate-600 text-right">
              <div className="truncate max-w-[220px]">{user?.email}</div>
              <div className="text-slate-500">Role: {role}</div>
            </div>
            <button
              onClick={async () => {
                await signOut()
                router.replace('/login')
              }}
              className="px-3 py-2 rounded-md text-sm bg-slate-100 hover:bg-slate-200"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-4">{children}</main>
    </div>
  )
}
