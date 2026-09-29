'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Icon } from '@/components/icon'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al iniciar sesión')
        return
      }
      router.push('/')
      router.refresh()
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-card">
            <Icon name="leaf" size={28} strokeWidth={2} />
          </div>
          <h1 className="text-[26px] font-bold tracking-tight text-ink">Verdurería Any</h1>
          <p className="mt-1 text-sm text-ink-2">Registro de compras de mercadería</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-card"
        >
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
              Correo
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3">
                <Icon name="mail" size={17} />
              </span>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface py-3 pl-10 pr-3.5 text-base outline-none transition-colors placeholder:text-ink-3 hover:border-line-strong focus:border-brand focus:ring-2 focus:ring-brand/20"
                placeholder="tu@correo.com"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
              Contraseña
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3">
                <Icon name="lock" size={17} />
              </span>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface py-3 pl-10 pr-3.5 text-base outline-none transition-colors placeholder:text-ink-3 hover:border-line-strong focus:border-brand focus:ring-2 focus:ring-brand/20"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <p className="flex items-start gap-2 rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger-ink">
              <Icon name="circle-alert" size={17} className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand py-3 text-[15px] font-semibold text-white shadow-card transition-all hover:bg-brand-strong active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <div className="mt-4 rounded-2xl border border-line bg-surface p-4 text-xs leading-relaxed text-ink-2 shadow-card">
          <p className="mb-1 font-semibold text-ink">Usuarios de prueba:</p>
          <p>admin@mercado.app / admin123 (administrador)</p>
          <p>maria@mercado.app / demo1234 (compradora y vendedora)</p>
        </div>
      </div>
    </div>
  )
}
