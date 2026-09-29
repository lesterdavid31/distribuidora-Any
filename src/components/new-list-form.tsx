'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Icon } from '@/components/icon'

type CatalogProduct = { id: string; name: string; icon: string; categoryId: string }
type Category = { id: string; name: string; icon: string; products: CatalogProduct[] }
type SelectedItem = { productId: string; quantity: string; unit: string }
type UserOption = { id: string; name: string; roles: string[] }

const UNITS = ['lb', 'kg', 'qq', 'unidad', 'docena', 'caja', 'bolsa', 'manojo']

export function NewListForm({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Map<string, SelectedItem>>(new Map())
  const [buyerId, setBuyerId] = useState('')
  const [users, setUsers] = useState<UserOption[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/users')
      .then((r) => (r.ok ? r.json() : { users: [] }))
      .then((d) => setUsers(d.users ?? []))
      .catch(() => {})
  }, [])

  const productById = useMemo(() => {
    const map = new Map<string, CatalogProduct & { categoryName: string }>()
    for (const cat of categories) {
      for (const p of cat.products) map.set(p.id, { ...p, categoryName: cat.name })
    }
    return map
  }, [categories])

  const searchLower = search.trim().toLowerCase()

  function toggle(productId: string) {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(productId)) next.delete(productId)
      else next.set(productId, { productId, quantity: '', unit: 'lb' })
      return next
    })
  }

  function updateItem(productId: string, patch: Partial<SelectedItem>) {
    setSelected((prev) => {
      const next = new Map(prev)
      const item = next.get(productId)
      if (item) next.set(productId, { ...item, ...patch })
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!title.trim()) {
      setError('Escribe un título para la lista')
      return
    }
    if (selected.size === 0) {
      setError('Selecciona al menos un producto')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          buyerId: buyerId || null,
          items: [...selected.values()].map((i) => ({
            productId: i.productId,
            quantity: i.quantity ? Number(i.quantity) : undefined,
            unit: i.quantity ? i.unit : undefined,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'No se pudo crear la lista')
        return
      }
      router.push(`/lists/${data.list.id}`)
      router.refresh()
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const defaultTitle = `Compras ${new Date().toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' })}`

  const submitButton = (
    <button
      type="submit"
      disabled={saving || selected.size === 0}
      className="w-full rounded-xl bg-brand px-4 py-3 text-[15px] font-semibold text-white shadow-card transition-all hover:bg-brand-strong active:scale-[0.99] disabled:opacity-50"
    >
      {saving ? 'Guardando…' : `Crear lista (${selected.size})`}
    </button>
  )

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Catálogo */}
      <div className="space-y-5">
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-3">
            <Icon name="search" size={18} />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto…"
            className="w-full rounded-xl border border-line bg-surface py-3 pl-11 pr-4 text-[15px] outline-none transition-colors placeholder:text-ink-3 hover:border-line-strong focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>

        {categories.map((cat) => {
          const products = searchLower
            ? cat.products.filter((p) => p.name.toLowerCase().includes(searchLower))
            : cat.products
          if (products.length === 0) return null
          return (
            <section key={cat.id}>
              <h2 className="mb-2.5 flex items-center gap-2 text-[15px] font-semibold text-ink">
                <span className="text-base">{cat.icon}</span>
                {cat.name}
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {products.map((p) => {
                  const isSelected = selected.has(p.id)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggle(p.id)}
                      aria-pressed={isSelected}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all active:scale-[0.98] ${
                        isSelected
                          ? 'border-brand bg-brand-soft text-brand-ink shadow-card'
                          : 'border-line bg-surface text-ink hover:border-line-strong'
                      }`}
                    >
                      <span className="text-xl">{p.icon}</span>
                      <span className="flex-1 leading-tight">{p.name}</span>
                      {isSelected && <Icon name="check" size={15} strokeWidth={2.4} />}
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {/* Lista en construcción */}
      <aside className="h-fit rounded-2xl border border-line bg-surface p-4 shadow-card lg:sticky lg:top-20">
        <h2 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-ink">
          <Icon name="receipt" size={17} className="text-ink-3" />
          Tu lista <span className="tnum text-sm font-normal text-ink-3">({selected.size})</span>
        </h2>

        <div className="mb-3">
          <label className="mb-1.5 block text-xs font-medium text-ink">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={defaultTitle}
            className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-ink-3 hover:border-line-strong focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>

        {users.length > 0 && (
          <div className="mb-3">
            <label className="mb-1.5 block text-xs font-medium text-ink">
              Asignar comprador (opcional)
            </label>
            <select
              value={buyerId}
              onChange={(e) => setBuyerId(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm outline-none transition-colors hover:border-line-strong focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              <option value="">Yo mismo compro</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="max-h-72 space-y-2 overflow-y-auto">
          {selected.size === 0 && (
            <p className="py-5 text-center text-sm text-ink-3">
              Toca los productos del catálogo para agregarlos
            </p>
          )}
          {[...selected.values()].map((item) => {
            const p = productById.get(item.productId)
            if (!p) return null
            return (
              <div key={item.productId} className="rounded-xl bg-paper p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-ink">
                    {p.icon} {p.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggle(item.productId)}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-danger-soft hover:text-danger"
                    aria-label="Quitar"
                  >
                    <Icon name="x" size={14} />
                  </button>
                </div>
                <div className="mt-1.5 flex gap-1.5">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.productId, { quantity: e.target.value })}
                    placeholder="Cant."
                    className="tnum w-20 rounded-lg border border-line bg-surface px-2 py-1.5 text-sm outline-none transition-colors hover:border-line-strong focus:border-brand"
                  />
                  <select
                    value={item.unit}
                    onChange={(e) => updateItem(item.productId, { unit: e.target.value })}
                    className="flex-1 rounded-lg border border-line bg-surface px-2 py-1.5 text-sm outline-none transition-colors hover:border-line-strong focus:border-brand"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )
          })}
        </div>

        {error && (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger-ink">
            <Icon name="circle-alert" size={17} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}

        {/* Botón de envío: visible en el aside en desktop */}
        <div className="mt-4 hidden lg:block">{submitButton}</div>
      </aside>

      {/* Barra de envío fija en móvil (sobre la tab bar) */}
      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-16 z-20 border-t border-line bg-surface/95 p-3 backdrop-blur lg:hidden">
          <div className="mx-auto max-w-5xl">{submitButton}</div>
        </div>
      )}
      {selected.size > 0 && <div className="h-20 lg:hidden" />}
    </form>
  )
}
