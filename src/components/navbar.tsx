'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Icon, type IconName } from '@/components/icon'
import { ROLE_LABELS } from '@/lib/utils'

type NavbarUser = { id: string; name: string; email: string; roles: string[] }

type NavLink = { href: string; label: string; icon: IconName }

export function Navbar({ user }: { user: NavbarUser }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const links: NavLink[] = [
    { href: '/', label: 'Inicio', icon: 'home' },
    { href: '/lists/new', label: 'Nueva lista', icon: 'plus' },
    { href: '/history', label: 'Historial', icon: 'history' },
    ...(user.roles.includes('ADMIN') ? [{ href: '/admin', label: 'Admin', icon: 'settings' as IconName }] : []),
  ]

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href))

  async function logout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Barra superior */}
      <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
              <Icon name="leaf" size={17} strokeWidth={2} />
            </span>
            <span className="text-[17px] font-bold tracking-tight text-ink">Verdurería Any</span>
          </Link>

          {/* Navegación desktop */}
          <nav className="ml-4 hidden flex-1 items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  isActive(link.href) ? 'bg-brand-soft text-brand-ink' : 'text-ink-2 hover:bg-paper hover:text-ink'
                }`}
              >
                <Icon name={link.icon} size={16} />
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2.5">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight text-ink">{user.name}</p>
              <p className="text-xs leading-tight text-ink-3">
                {user.roles.map((r) => ROLE_LABELS[r] ?? r).join(' · ')}
              </p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand-ink">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <button
              onClick={logout}
              disabled={loggingOut}
              aria-label="Cerrar sesión"
              title={loggingOut ? 'Saliendo…' : 'Salir'}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-2 transition-colors hover:border-danger/40 hover:bg-danger-soft hover:text-danger disabled:opacity-50"
            >
              <Icon name="log-out" size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Tab bar inferior (móvil) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        aria-label="Navegación principal"
      >
        <div className="grid auto-cols-fr grid-flow-col">
          {links.map((link) => {
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  active ? 'text-brand' : 'text-ink-3 hover:text-ink'
                }`}
              >
                <Icon name={link.icon} size={21} strokeWidth={active ? 2.1 : 1.8} />
                {link.label.replace(' lista', '')}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
