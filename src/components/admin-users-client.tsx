'use client'

import { useState } from 'react'
import { Icon } from '@/components/icon'
import { ROLE_LABELS } from '@/lib/utils'

type AdminUser = {
  id: string
  name: string
  email: string
  active: boolean
  roles: string[]
  createdLists: number
  assignedLists: number
}

const ALL_ROLES = ['COMPRADOR', 'VENDEDOR', 'ADMIN'] as const
const emptyForm = { name: '', email: '', password: '', roles: [] as string[] }

const ROLE_STYLES: Record<string, string> = {
  ADMIN: 'bg-violet-soft text-violet-ink',
  COMPRADOR: 'bg-info-soft text-info-ink',
  VENDEDOR: 'bg-warn-soft text-warn-ink',
}

export function AdminUsersClient({
  initialUsers,
  currentUserId,
}: {
  initialUsers: AdminUser[]
  currentUserId: string
}) {
  const [users, setUsers] = useState(initialUsers)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [editPassword, setEditPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function toggleRole(formRoles: string[], role: string) {
    return formRoles.includes(role) ? formRoles.filter((r) => r !== role) : [...formRoles, role]
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.roles.length === 0) {
      setError('Asigna al menos un rol')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'No se pudo crear el usuario')
        return
      }
      setUsers((prev) => [
        ...prev,
        {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          active: true,
          roles: form.roles,
          createdLists: 0,
          assignedLists: 0,
        },
      ])
      setForm(emptyForm)
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    setError('')
    if (editing.roles.length === 0) {
      setError('Asigna al menos un rol')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editing.name,
          roles: editing.roles,
          active: editing.active,
          ...(editPassword ? { password: editPassword } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'No se pudo guardar')
        return
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editing.id
            ? { ...u, name: data.user.name, roles: data.user.roles, active: data.user.active }
            : u,
        ),
      )
      setEditing(null)
      setEditPassword('')
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    'w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-ink-3 hover:border-line-strong focus:border-brand focus:ring-2 focus:ring-brand/20'

  const chipCls = (selected: boolean) =>
    `cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
      selected
        ? 'border-brand bg-brand text-white'
        : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink'
    }`

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Tabla de usuarios */}
      <div className="h-fit overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        {users.map((u) => (
          <div
            key={u.id}
            className={`flex flex-wrap items-center gap-3 border-b border-line px-4 py-3.5 last:border-0 ${
              u.active ? '' : 'bg-paper opacity-60'
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand-ink">
              {u.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">
                {u.name}
                {u.id === currentUserId && (
                  <span className="ml-1 text-xs text-ink-3">(tú)</span>
                )}
              </p>
              <p className="text-xs text-ink-3">{u.email}</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {u.roles.map((r) => (
                <span
                  key={r}
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    ROLE_STYLES[r] ?? 'bg-paper text-ink-2'
                  }`}
                >
                  {ROLE_LABELS[r] ?? r}
                </span>
              ))}
            </div>
            <span className="tnum hidden text-xs text-ink-3 sm:block">
              {u.createdLists} listas · {u.assignedLists} asignadas
            </span>
            <button
              onClick={() => {
                setEditing({ ...u })
                setEditPassword('')
                setError('')
              }}
              title="Editar"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-brand-soft hover:text-brand-ink"
            >
              <Icon name="pencil" size={15} />
            </button>
          </div>
        ))}
      </div>

      {/* Formulario */}
      <aside className="h-fit rounded-2xl border border-line bg-surface p-4 shadow-card lg:sticky lg:top-20">
        {editing ? (
          <form onSubmit={handleUpdate} className="space-y-3">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
              <Icon name="pencil" size={16} className="text-ink-3" />
              Editar usuario
            </h2>
            <input
              type="text"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className={inputCls}
              required
            />
            <p className="text-xs text-ink-3">{editing.email}</p>

            <div>
              <p className="mb-1.5 text-xs font-medium text-ink">Roles</p>
              <div className="flex flex-wrap gap-2">
                {ALL_ROLES.map((role) => (
                  <label key={role} className={chipCls(editing.roles.includes(role))}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={editing.roles.includes(role)}
                      onChange={() => setEditing({ ...editing, roles: toggleRole(editing.roles, role) })}
                    />
                    {ROLE_LABELS[role]}
                  </label>
                ))}
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={editing.active}
                onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                className="h-4 w-4 rounded accent-brand"
              />
              Usuario activo
            </label>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink">
                Nueva contraseña (opcional)
              </label>
              <input
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Dejar vacío para no cambiar"
                className={inputCls}
                minLength={6}
              />
            </div>

            {error && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-danger">
                <Icon name="circle-alert" size={13} />
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-brand py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-50"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCreate} className="space-y-3">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
              <Icon name="plus" size={16} className="text-ink-3" />
              Nuevo usuario
            </h2>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nombre completo"
              className={inputCls}
              required
            />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="correo@ejemplo.com"
              className={inputCls}
              required
            />
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Contraseña (mín. 6 caracteres)"
              className={inputCls}
              required
              minLength={6}
            />

            <div>
              <p className="mb-1.5 text-xs font-medium text-ink">Roles</p>
              <div className="flex flex-wrap gap-2">
                {ALL_ROLES.map((role) => (
                  <label key={role} className={chipCls(form.roles.includes(role))}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={form.roles.includes(role)}
                      onChange={() => setForm({ ...form, roles: toggleRole(form.roles, role) })}
                    />
                    {ROLE_LABELS[role]}
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-danger">
                <Icon name="circle-alert" size={13} />
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-brand py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-50"
            >
              Crear usuario
            </button>
          </form>
        )}
      </aside>
    </div>
  )
}
