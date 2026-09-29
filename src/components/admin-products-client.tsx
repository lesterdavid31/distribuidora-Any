'use client'

import { useState } from 'react'
import { Icon } from '@/components/icon'

type Category = { id: string; name: string; icon: string }
type Product = {
  id: string
  name: string
  icon: string
  visible: boolean
  order: number
  categoryId: string
  categoryName: string
  usageCount: number
}

const emptyForm = { name: '', icon: '', categoryId: '', order: '0' }

export function AdminProductsClient({
  categories,
  initialProducts,
}: {
  categories: Category[]
  initialProducts: Product[]
}) {
  const [products, setProducts] = useState(initialProducts)
  const [form, setForm] = useState({ ...emptyForm, categoryId: categories[0]?.id ?? '' })
  const [editing, setEditing] = useState<Product | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function toggleVisible(product: Product) {
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: !product.visible }),
    })
    if (res.ok) {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, visible: !p.visible } : p)))
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          icon: form.icon || '🧺',
          categoryId: form.categoryId,
          order: Number(form.order) || 0,
          visible: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'No se pudo crear')
        return
      }
      const p = data.product
      setProducts((prev) => [
        ...prev,
        {
          id: p.id,
          name: p.name,
          icon: p.icon,
          visible: p.visible,
          order: p.order,
          categoryId: p.categoryId,
          categoryName: p.category.name,
          usageCount: 0,
        },
      ])
      setForm({ ...emptyForm, categoryId: form.categoryId })
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    setError('')
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/products/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editing.name,
          icon: editing.icon,
          categoryId: editing.categoryId,
          order: editing.order,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'No se pudo guardar')
        return
      }
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editing.id ? { ...editing, categoryName: data.product.category.name } : p,
        ),
      )
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(product: Product) {
    if (!confirm(`¿Eliminar "${product.name}"?`)) return
    const res = await fetch(`/api/admin/products/${product.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) {
      alert(data.error ?? 'No se pudo eliminar')
      return
    }
    setProducts((prev) => prev.filter((p) => p.id !== product.id))
  }

  const inputCls =
    'w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-ink-3 hover:border-line-strong focus:border-brand focus:ring-2 focus:ring-brand/20'

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Tabla de productos */}
      <div className="space-y-5">
        {categories.map((cat) => {
          const catProducts = products.filter((p) => p.categoryId === cat.id)
          if (catProducts.length === 0) return null
          return (
            <section key={cat.id}>
              <h2 className="mb-2.5 flex items-center gap-2 text-[15px] font-semibold text-ink">
                <span className="text-base">{cat.icon}</span>
                {cat.name}
                <span className="tnum text-xs font-normal text-ink-3">
                  {catProducts.filter((p) => p.visible).length}/{catProducts.length} visibles
                </span>
              </h2>
              <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
                {catProducts.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 border-b border-line px-3.5 py-2.5 last:border-0 ${
                      p.visible ? '' : 'bg-paper opacity-60'
                    }`}
                  >
                    <button
                      onClick={() => toggleVisible(p)}
                      title={p.visible ? 'Ocultar del catálogo' : 'Mostrar en catálogo'}
                      aria-pressed={p.visible}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                        p.visible ? 'bg-brand' : 'bg-line-strong'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                          p.visible ? 'left-[22px]' : 'left-0.5'
                        }`}
                      />
                    </button>
                    <span className="text-xl">{p.icon}</span>
                    <span className="flex-1 text-sm font-medium text-ink">{p.name}</span>
                    <span className="tnum hidden text-xs text-ink-3 sm:block">
                      en {p.usageCount} listas
                    </span>
                    <button
                      onClick={() => setEditing({ ...p })}
                      title="Editar"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-brand-soft hover:text-brand-ink"
                    >
                      <Icon name="pencil" size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      title="Eliminar"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-danger transition-colors hover:bg-danger-soft"
                    >
                      <Icon name="trash-2" size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {/* Formulario agregar / editar */}
      <aside className="h-fit rounded-2xl border border-line bg-surface p-4 shadow-card lg:sticky lg:top-20">
        {editing ? (
          <form onSubmit={handleUpdate} className="space-y-3">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
              <Icon name="pencil" size={16} className="text-ink-3" />
              Editar producto
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={editing.icon}
                onChange={(e) => setEditing({ ...editing, icon: e.target.value })}
                className="w-16 rounded-xl border border-line bg-surface px-2 py-2.5 text-center text-xl outline-none transition-colors hover:border-line-strong focus:border-brand"
                maxLength={4}
                required
              />
              <input
                type="text"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className={`flex-1 ${inputCls}`}
                required
              />
            </div>
            <select
              value={editing.categoryId}
              onChange={(e) => setEditing({ ...editing, categoryId: e.target.value })}
              className={inputCls}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={editing.order}
              onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })}
              className={inputCls}
              min={0}
              placeholder="Orden"
            />
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
              Nuevo producto
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="🍅"
                className="w-16 rounded-xl border border-line bg-surface px-2 py-2.5 text-center text-xl outline-none transition-colors placeholder:text-ink-3 hover:border-line-strong focus:border-brand"
                maxLength={4}
              />
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nombre del producto"
                className={`flex-1 ${inputCls}`}
                required
              />
            </div>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className={inputCls}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: e.target.value })}
              className={inputCls}
              min={0}
              placeholder="Orden (0 = primero)"
            />
            <p className="flex items-start gap-1.5 text-xs text-ink-3">
              <Icon name="info" size={13} className="mt-0.5 shrink-0" />
              Pega un emoji como icono (Win + . para abrir el selector de emojis)
            </p>
            {error && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-danger">
                <Icon name="circle-alert" size={13} />
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={saving || !form.name.trim()}
              className="w-full rounded-xl bg-brand py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-50"
            >
              Agregar producto
            </button>
          </form>
        )}
      </aside>
    </div>
  )
}
