import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { StatusBadge } from '@/components/status-badge'
import { Icon, type IconName } from '@/components/icon'
import { formatDate, formatQ } from '@/lib/utils'

export default async function HistoryPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const lists = await prisma.purchaseList.findMany({
    where: { OR: [{ creatorId: user.id }, { buyerId: user.id }] },
    orderBy: [{ purchaseDate: 'desc' }, { createdAt: 'desc' }],
    include: {
      creator: { select: { id: true, name: true } },
      buyer: { select: { id: true, name: true } },
      items: true,
    },
  })

  const completed = lists.filter((l) => l.status === 'COMPLETADA')
  const totalCompra = completed.reduce(
    (s, l) => s + l.items.reduce((a, i) => a + Number(i.purchasePrice ?? 0), 0),
    0,
  )
  const totalVenta = completed.reduce(
    (s, l) => s + l.items.reduce((a, i) => a + Number(i.salePrice ?? 0), 0),
    0,
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-ink">Historial</h1>
        <p className="mt-0.5 text-sm text-ink-2">Todas las listas en las que has participado</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        <StatCard label="Listas completadas" value={completed.length.toString()} icon="receipt" />
        <StatCard label="Total compras" value={formatQ(totalCompra)} icon="banknote" />
        <StatCard label="Total ventas" value={formatQ(totalVenta)} icon="tag" />
        <StatCard label="Margen" value={formatQ(totalVenta - totalCompra)} icon="trending-up" />
      </div>

      {lists.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line-strong bg-surface/60 px-4 py-10 text-center text-sm text-ink-2">
          Aún no tienes listas registradas.{' '}
          <Link href="/lists/new" className="font-semibold text-brand underline underline-offset-2">
            Crea tu primera lista
          </Link>
        </p>
      ) : (
        <div className="space-y-2.5">
          {lists.map((list) => {
            const checked = list.items.filter((i) => i.checked)
            const listCompra = checked.reduce((s, i) => s + Number(i.purchasePrice ?? 0), 0)
            const listVenta = checked.reduce((s, i) => s + Number(i.salePrice ?? 0), 0)
            const myRole =
              list.creatorId === user.id && list.buyerId === user.id
                ? 'Creador y comprador'
                : list.creatorId === user.id
                  ? 'Creador'
                  : 'Comprador'
            return (
              <Link
                key={list.id}
                href={`/lists/${list.id}`}
                className="block rounded-2xl border border-line bg-surface p-4 shadow-card transition-all hover:border-line-strong hover:shadow-raised active:scale-[0.99]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold text-ink">{list.title}</h3>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-2">
                      <span className="flex items-center gap-1">
                        <Icon name="calendar" size={13} className="text-ink-3" />
                        {formatDate(list.purchaseDate ?? list.createdAt)}
                      </span>
                      <span className="text-line-strong">·</span>
                      <span>{myRole}</span>
                      <span className="text-line-strong">·</span>
                      <span className="tnum">
                        {checked.length}/{list.items.length} productos
                      </span>
                    </p>
                  </div>
                  <StatusBadge status={list.status} />
                </div>
                {listCompra > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <span className="flex items-center gap-1.5 text-ink-2">
                      <Icon name="banknote" size={14} className="text-ink-3" />
                      Compra: <strong className="tnum font-semibold text-ink">{formatQ(listCompra)}</strong>
                    </span>
                    {listVenta > 0 && (
                      <span className="flex items-center gap-1.5 text-ink-2">
                        <Icon name="tag" size={14} className="text-ink-3" />
                        Venta: <strong className="tnum font-semibold text-ink">{formatQ(listVenta)}</strong>
                      </span>
                    )}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: IconName }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-3.5 shadow-card sm:p-4">
      <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand-ink">
        <Icon name={icon} size={16} />
      </span>
      <p className="tnum whitespace-nowrap text-base font-bold text-ink sm:text-xl">{value}</p>
      <p className="text-[11px] text-ink-3 sm:text-xs">{label}</p>
    </div>
  )
}
