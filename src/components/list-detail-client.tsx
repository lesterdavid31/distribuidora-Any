'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useRef, useState } from 'react'
import { StatusBadge } from '@/components/status-badge'
import { Icon } from '@/components/icon'
import { formatDate, formatQ } from '@/lib/utils'
import { buildWhatsAppText, whatsappUrl } from '@/lib/whatsapp'

export type SerializableItem = {
  id: string
  checked: boolean
  quantity: number | null
  unit: string | null
  purchasePrice: number | null
  salePrice: number | null
  product: { name: string; icon: string; category: { name: string; icon: string } }
}

export type SerializableList = {
  id: string
  title: string
  status: string
  purchaseDate: string | null
  createdAt: string
  creator: { id: string; name: string }
  buyer: { id: string; name: string } | null
  shares: { id: string; sharedWith: { id: string; name: string } }[]
  items: SerializableItem[]
}

type UserOption = { id: string; name: string }

export function ListDetailClient({
  list,
  canEdit,
  canShare,
  isCreator,
  isAdmin,
}: {
  list: SerializableList
  canEdit: boolean
  canShare: boolean
  isCreator: boolean
  isAdmin: boolean
}) {
  const router = useRouter()
  const [items, setItems] = useState(list.items)
  const [status, setStatus] = useState(list.status)
  const [purchaseDate, setPurchaseDate] = useState(list.purchaseDate)
  const [shares, setShares] = useState(list.shares)

  const checkedCount = items.filter((i) => i.checked).length
  const progress = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0
  const totalCompra = items.filter((i) => i.checked).reduce((s, i) => s + (i.purchasePrice ?? 0), 0)
  const totalVenta = items.filter((i) => i.checked).reduce((s, i) => s + (i.salePrice ?? 0), 0)

  const grouped = useMemo(() => {
    const map = new Map<string, { icon: string; items: SerializableItem[] }>()
    for (const item of items) {
      const cat = item.product.category.name
      if (!map.has(cat)) map.set(cat, { icon: item.product.category.icon, items: [] })
      map.get(cat)!.items.push(item)
    }
    return map
  }, [items])

  function applyItemUpdate(updated: SerializableItem, listStatus: string, newPurchaseDate: string | null) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? { ...i, ...updated } : i)))
    setStatus(listStatus)
    if (newPurchaseDate && !purchaseDate) setPurchaseDate(newPurchaseDate)
  }

  async function handleDateChange(value: string) {
    const res = await fetch(`/api/lists/${list.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purchaseDate: value || null }),
    })
    if (res.ok) setPurchaseDate(value ? new Date(`${value}T12:00:00`).toISOString() : null)
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar esta lista? Esta acción no se puede deshacer.')) return
    const res = await fetch(`/api/lists/${list.id}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/')
      router.refresh()
    }
  }

  const waText = buildWhatsAppText({ ...list, items, purchaseDate, buyer: list.buyer, creator: list.creator })

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-ink">{list.title}</h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-2">
              <span className="flex items-center gap-1.5">
                <Icon name="user" size={14} className="text-ink-3" />
                {list.creator.name}
              </span>
              {list.buyer && (
                <span className="flex items-center gap-1.5">
                  <Icon name="shopping-cart" size={14} className="text-ink-3" />
                  Comprador: {list.buyer.name}
                </span>
              )}
            </p>
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <label className="flex items-center gap-1.5 text-ink-2">
            <Icon name="calendar" size={15} className="text-ink-3" />
            Fecha de compra:
            {canEdit ? (
              <input
                type="date"
                value={purchaseDate ? purchaseDate.slice(0, 10) : ''}
                onChange={(e) => handleDateChange(e.target.value)}
                className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm outline-none transition-colors hover:border-line-strong focus:border-brand"
              />
            ) : (
              <span className="font-medium text-ink">{formatDate(purchaseDate)}</span>
            )}
          </label>
          <span className="text-[13px] text-ink-3">Creada: {formatDate(list.createdAt)}</span>
        </div>

        {/* Progreso */}
        <div className="mt-4">
          <div className="flex justify-between text-xs font-medium text-ink-2">
            <span>
              <span className="tnum font-semibold text-ink">{checkedCount}</span>
              <span className="tnum">/{items.length}</span> productos comprados
            </span>
            <span className="tnum">{progress}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Productos por categoría */}
      {canEdit && (
        <p className="flex items-start gap-2 rounded-2xl bg-info-soft px-4 py-3 text-sm text-info-ink">
          <Icon name="info" size={17} className="mt-0.5 shrink-0" />
          <span>
            Marca la casilla de cada producto comprado y anota el <strong>precio de compra</strong>{' '}
            (obligatorio). El <strong>precio de venta</strong> es opcional.
          </span>
        </p>
      )}

      {[...grouped.entries()].map(([category, { icon, items: catItems }]) => (
        <section key={category}>
          <h2 className="mb-2.5 flex items-center gap-2 text-[15px] font-semibold text-ink">
            <span className="text-base">{icon}</span>
            {category}
          </h2>
          <div className="space-y-2">
            {catItems.map((item) => (
              <ItemRow
                key={item.id}
                listId={list.id}
                item={item}
                canEdit={canEdit}
                onUpdate={applyItemUpdate}
              />
            ))}
          </div>
        </section>
      ))}

      {/* Totales */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        <div className="rounded-2xl border border-line bg-surface p-2.5 text-center shadow-card sm:p-4">
          <p className="mb-1 flex items-center justify-center gap-1 text-[10px] font-medium text-ink-3 sm:gap-1.5 sm:text-xs">
            <Icon name="banknote" size={14} />
            Total compra
          </p>
          <p className="tnum whitespace-nowrap text-[15px] font-bold text-ink sm:text-xl">{formatQ(totalCompra)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-2.5 text-center shadow-card sm:p-4">
          <p className="mb-1 flex items-center justify-center gap-1 text-[10px] font-medium text-ink-3 sm:gap-1.5 sm:text-xs">
            <Icon name="tag" size={14} />
            Total venta
          </p>
          <p className="tnum whitespace-nowrap text-[15px] font-bold text-ink sm:text-xl">
            {totalVenta > 0 ? formatQ(totalVenta) : '—'}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-2.5 text-center shadow-card sm:p-4">
          <p className="mb-1 flex items-center justify-center gap-1 text-[10px] font-medium text-ink-3 sm:gap-1.5 sm:text-xs">
            <Icon name="trending-up" size={14} />
            Margen
          </p>
          <p
            className={`tnum whitespace-nowrap text-[15px] font-bold sm:text-xl ${
              totalVenta - totalCompra >= 0 ? 'text-brand' : 'text-danger'
            }`}
          >
            {totalVenta > 0 ? formatQ(totalVenta - totalCompra) : '—'}
          </p>
        </div>
      </div>

      {/* Compartir */}
      <ShareSection
        listId={list.id}
        canShare={canShare}
        shares={shares}
        setShares={setShares}
        waText={waText}
      />

      {/* Eliminar */}
      {(isCreator || isAdmin) && (
        <button
          onClick={handleDelete}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-danger/30 py-3 text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
        >
          <Icon name="trash-2" size={16} />
          Eliminar lista
        </button>
      )}
    </div>
  )
}

/* ---------------- Fila de producto (modo compra) ---------------- */

function ItemRow({
  listId,
  item,
  canEdit,
  onUpdate,
}: {
  listId: string
  item: SerializableItem
  canEdit: boolean
  onUpdate: (item: SerializableItem, listStatus: string, purchaseDate: string | null) => void
}) {
  const [checked, setChecked] = useState(item.checked)
  const [purchasePrice, setPurchasePrice] = useState(item.purchasePrice?.toString() ?? '')
  const [salePrice, setSalePrice] = useState(item.salePrice?.toString() ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const priceRef = useRef<HTMLInputElement>(null)

  async function save(payload: Record<string, unknown>) {
    setSaving(true)
    try {
      const res = await fetch(`/api/lists/${listId}/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al guardar')
        return null
      }
      setError('')
      return data
    } catch {
      setError('Error de conexión')
      return null
    } finally {
      setSaving(false)
    }
  }

  async function handleCheck() {
    if (saving) return
    if (!checked) {
      const price = parseFloat(purchasePrice)
      if (!price || price <= 0) {
        setError('Precio de compra obligatorio')
        priceRef.current?.focus()
        return
      }
      const data = await save({
        checked: true,
        purchasePrice: price,
        salePrice: salePrice ? parseFloat(salePrice) : null,
      })
      if (data) {
        setChecked(true)
        onUpdate(
          { ...item, checked: true, purchasePrice: price, salePrice: salePrice ? parseFloat(salePrice) : null },
          data.listStatus,
          data.purchaseDate,
        )
      }
    } else {
      const data = await save({ checked: false })
      if (data) {
        setChecked(false)
        setPurchasePrice('')
        setSalePrice('')
        onUpdate(
          { ...item, checked: false, purchasePrice: null, salePrice: null },
          data.listStatus,
          data.purchaseDate,
        )
      }
    }
  }

  async function handlePriceBlur() {
    if (!checked || saving) return
    const price = parseFloat(purchasePrice)
    if (!price || price <= 0) {
      setError('Precio de compra obligatorio')
      return
    }
    const sale = salePrice ? parseFloat(salePrice) : null
    if (price === item.purchasePrice && sale === item.salePrice) return // sin cambios
    const data = await save({ checked: true, purchasePrice: price, salePrice: sale })
    if (data) {
      onUpdate({ ...item, checked: true, purchasePrice: price, salePrice: sale }, data.listStatus, data.purchaseDate)
    }
  }

  return (
    <div
      className={`rounded-2xl border p-3.5 shadow-card transition-colors ${
        checked ? 'border-brand/40 bg-brand-soft/40' : 'border-line bg-surface'
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleCheck}
          disabled={!canEdit || saving}
          aria-label={checked ? 'Desmarcar' : 'Marcar como comprado'}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 transition-colors disabled:cursor-not-allowed ${
            checked
              ? 'border-brand bg-brand text-white'
              : 'border-line-strong bg-surface text-transparent hover:border-brand'
          }`}
        >
          {checked && <Icon name="check" size={17} strokeWidth={2.6} className="animate-check-pop" />}
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium text-ink">
            {item.product.icon} {item.product.name}
          </p>
          {(item.quantity || item.unit) && (
            <p className="tnum text-xs text-ink-3">
              Cantidad: {item.quantity ?? ''} {item.unit ?? ''}
            </p>
          )}
        </div>

        {saving && <span className="text-xs text-ink-3">Guardando…</span>}
      </div>

      {canEdit ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-2 pl-11">
          <label className="flex min-w-[140px] flex-1 items-center gap-1.5 whitespace-nowrap text-xs font-medium text-ink-2 sm:flex-none">
            Compra Q<span className="text-danger">*</span>
            <input
              ref={priceRef}
              type="number"
              min="0"
              step="0.01"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              onBlur={handlePriceBlur}
              placeholder="0.00"
              className="tnum w-full min-w-0 rounded-lg border border-line bg-surface px-2.5 py-2 text-sm outline-none transition-colors hover:border-line-strong focus:border-brand sm:w-32"
            />
          </label>
          <label className="flex min-w-[128px] flex-1 items-center gap-1.5 whitespace-nowrap text-xs font-medium text-ink-2 sm:flex-none">
            Venta Q
            <input
              type="number"
              min="0"
              step="0.01"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              onBlur={handlePriceBlur}
              placeholder="opcional"
              className="tnum w-full min-w-0 rounded-lg border border-line bg-surface px-2.5 py-2 text-sm outline-none transition-colors hover:border-line-strong focus:border-brand sm:w-32"
            />
          </label>
        </div>
      ) : (
        checked && (
          <p className="tnum mt-1.5 pl-11 text-sm text-ink-2">
            Compra: {formatQ(item.purchasePrice)}
            {item.salePrice ? ` · Venta: ${formatQ(item.salePrice)}` : ''}
          </p>
        )
      )}

      {error && (
        <p className="mt-1.5 flex items-center gap-1.5 pl-11 text-xs font-medium text-danger">
          <Icon name="circle-alert" size={13} />
          {error}
        </p>
      )}
    </div>
  )
}

/* ---------------- Sección compartir ---------------- */

function ShareSection({
  listId,
  canShare,
  shares,
  setShares,
  waText,
}: {
  listId: string
  canShare: boolean
  shares: { id: string; sharedWith: { id: string; name: string } }[]
  setShares: React.Dispatch<React.SetStateAction<{ id: string; sharedWith: { id: string; name: string } }[]>>
  waText: string
}) {
  const [users, setUsers] = useState<UserOption[]>([])
  const [selectedUser, setSelectedUser] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)

  async function loadUsers() {
    if (users.length > 0 || loadingUsers) return
    setLoadingUsers(true)
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      if (res.ok) setUsers(data.users ?? [])
    } finally {
      setLoadingUsers(false)
    }
  }

  async function handleShare() {
    setError('')
    if (!selectedUser) return
    const res = await fetch(`/api/lists/${listId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: selectedUser }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'No se pudo compartir')
      return
    }
    setShares((prev) => [...prev, { id: data.share.id, sharedWith: data.share.sharedWith }])
    setSelectedUser('')
  }

  async function handleUnshare(userId: string) {
    const res = await fetch(`/api/lists/${listId}/share?userId=${userId}`, { method: 'DELETE' })
    if (res.ok) setShares((prev) => prev.filter((s) => s.sharedWith.id !== userId))
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(waText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback para navegadores sin clipboard API
      const textarea = document.createElement('textarea')
      textarea.value = waText
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <h2 className="mb-3.5 flex items-center gap-2 text-[15px] font-semibold text-ink">
        <Icon name="share-2" size={17} className="text-ink-3" />
        Compartir lista
      </h2>

      {/* WhatsApp */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-brand hover:text-brand-ink"
        >
          <Icon name={copied ? 'check' : 'copy'} size={15} />
          {copied ? '¡Copiada!' : 'Copiar lista'}
        </button>
        <a
          href={whatsappUrl(waText)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-full bg-whatsapp px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-whatsapp-strong"
        >
          <Icon name="message-circle" size={15} />
          Enviar por WhatsApp
        </a>
      </div>

      {/* Interno */}
      {canShare && (
        <div className="mt-4 border-t border-line pt-4">
          <p className="mb-2.5 text-sm text-ink-2">Compartir con un usuario del sistema:</p>
          <div className="flex gap-2">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              onFocus={loadUsers}
              className="flex-1 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm outline-none transition-colors hover:border-line-strong focus:border-brand"
            >
              <option value="">{loadingUsers ? 'Cargando…' : 'Selecciona un usuario'}</option>
              {users
                .filter((u) => !shares.some((s) => s.sharedWith.id === u.id))
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
            <button
              onClick={handleShare}
              disabled={!selectedUser}
              className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-50"
            >
              Compartir
            </button>
          </div>
          {error && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-danger">
              <Icon name="circle-alert" size={13} />
              {error}
            </p>
          )}

          {shares.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {shares.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft py-1.5 pl-3 pr-1.5 text-sm font-medium text-brand-ink"
                >
                  <Icon name="users" size={14} />
                  {s.sharedWith.name}
                  <button
                    onClick={() => handleUnshare(s.sharedWith.id)}
                    className="flex h-5 w-5 items-center justify-center rounded-full text-brand-ink/60 transition-colors hover:text-danger"
                    aria-label={`Quitar acceso a ${s.sharedWith.name}`}
                  >
                    <Icon name="x" size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
