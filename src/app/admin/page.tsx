import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Icon } from '@/components/icon'

export default async function AdminPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!user.roles.includes('ADMIN')) redirect('/')

  const [usersCount, productsCount, visibleCount, listsCount] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.product.count({ where: { visible: true } }),
    prisma.purchaseList.count(),
  ])

  const stats = [
    { icon: 'users' as const, value: usersCount, label: 'Usuarios' },
    { icon: 'package' as const, value: productsCount, label: 'Productos totales' },
    { icon: 'eye' as const, value: visibleCount, label: 'Visibles en catálogo' },
    { icon: 'receipt' as const, value: listsCount, label: 'Listas creadas' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-ink">Panel de administración</h1>
        <p className="mt-0.5 text-sm text-ink-2">Gestiona el catálogo, los usuarios y sus roles</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-surface p-4 shadow-card">
            <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand-ink">
              <Icon name={s.icon} size={17} />
            </span>
            <p className="tnum text-xl font-bold text-ink">{s.value}</p>
            <p className="text-xs text-ink-3">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/products"
          className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card transition-all hover:border-line-strong hover:shadow-raised active:scale-[0.99]"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">
            <Icon name="package" size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold text-ink">Catálogo de productos</h2>
            <p className="mt-0.5 text-sm text-ink-2">
              Agrega, edita y elige qué productos ven los usuarios
            </p>
          </div>
          <Icon name="chevron-right" size={18} className="text-ink-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link
          href="/admin/users"
          className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card transition-all hover:border-line-strong hover:shadow-raised active:scale-[0.99]"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">
            <Icon name="users" size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold text-ink">Usuarios y roles</h2>
            <p className="mt-0.5 text-sm text-ink-2">
              Crea usuarios y asígnales roles (comprador, vendedor, admin)
            </p>
          </div>
          <Icon name="chevron-right" size={18} className="text-ink-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  )
}
