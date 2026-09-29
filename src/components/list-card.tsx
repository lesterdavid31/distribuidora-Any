import Link from 'next/link'
import { StatusBadge } from './status-badge'
import { Icon } from './icon'
import { formatDate, formatQ } from '@/lib/utils'

type ListCardItem = {
  checked: boolean
  purchasePrice: unknown
}

export type ListCardList = {
  id: string
  title: string
  status: string
  purchaseDate: Date | string | null
  createdAt: Date | string
  creator: { id: string; name: string }
  buyer: { id: string; name: string } | null
  items: ListCardItem[]
}

export function ListCard({ list }: { list: ListCardList }) {
  const total = list.items.length
  const checked = list.items.filter((i) => i.checked).length
  const totalCompra = list.items
    .filter((i) => i.checked)
    .reduce((s, i) => s + Number(i.purchasePrice ?? 0), 0)
  const progress = total > 0 ? Math.round((checked / total) * 100) : 0

  return (
    <Link
      href={`/lists/${list.id}`}
      className="block rounded-2xl border border-line bg-surface p-4 shadow-card transition-all hover:border-line-strong hover:shadow-raised active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[15px] font-semibold leading-snug text-ink">{list.title}</h3>
        <StatusBadge status={list.status} />
      </div>

      <div className="mt-2 space-y-1 text-[13px] text-ink-2">
        <p className="flex items-center gap-1.5">
          <Icon name="calendar" size={14} className="shrink-0 text-ink-3" />
          {formatDate(list.purchaseDate ?? list.createdAt)}
        </p>
        <p className="flex items-center gap-1.5">
          <Icon name="user" size={14} className="shrink-0 text-ink-3" />
          {list.creator.name}
          {list.buyer && (
            <>
              <span className="text-line-strong">·</span>
              <Icon name="shopping-cart" size={14} className="shrink-0 text-ink-3" />
              {list.buyer.name}
            </>
          )}
        </p>
      </div>

      <div className="mt-3.5">
        <div className="flex items-baseline justify-between text-xs text-ink-2">
          <span>
            <span className="tnum font-semibold text-ink">{checked}</span>
            <span className="tnum">/{total}</span> productos
          </span>
          {totalCompra > 0 && (
            <span className="tnum text-[13px] font-semibold text-ink">{formatQ(totalCompra)}</span>
          )}
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Link>
  )
}
