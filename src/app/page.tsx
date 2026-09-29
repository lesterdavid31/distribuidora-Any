import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ListCard } from '@/components/list-card'
import { Icon, type IconName } from '@/components/icon'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [assigned, mine, shared] = await Promise.all([
    // Listas que debo comprar (pendientes primero)
    prisma.purchaseList.findMany({
      where: { buyerId: user.id, status: { not: 'COMPLETADA' } },
      orderBy: { createdAt: 'desc' },
      include: { creator: { select: { id: true, name: true } }, buyer: { select: { id: true, name: true } }, items: true },
      take: 20,
    }),
    // Mis listas creadas
    prisma.purchaseList.findMany({
      where: { creatorId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { creator: { select: { id: true, name: true } }, buyer: { select: { id: true, name: true } }, items: true },
      take: 20,
    }),
    // Compartidas conmigo
    prisma.purchaseList.findMany({
      where: { shares: { some: { sharedWithId: user.id } }, NOT: { creatorId: user.id } },
      orderBy: { createdAt: 'desc' },
      include: { creator: { select: { id: true, name: true } }, buyer: { select: { id: true, name: true } }, items: true },
      take: 20,
    }),
  ])

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-ink">
            Hola, {user.name.split(' ')[0]}
          </h1>
          <p className="mt-0.5 text-sm text-ink-2">Tus listas de compras de mercadería</p>
        </div>
        <Link
          href="/lists/new"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-[15px] font-semibold text-white shadow-card transition-all hover:bg-brand-strong active:scale-[0.99] sm:w-auto sm:py-2.5"
        >
          <Icon name="plus" size={18} strokeWidth={2.2} />
          Nueva lista
        </Link>
      </div>

      <Section
        title="Para comprar"
        icon="shopping-cart"
        empty="No tienes listas asignadas para comprar"
        lists={assigned}
      />
      <Section title="Mis listas" icon="clipboard-list" empty="Aún no has creado listas" lists={mine} />
      <Section
        title="Compartidas conmigo"
        icon="users"
        empty="Nadie ha compartido listas contigo"
        lists={shared}
      />
    </div>
  )
}

function Section({
  title,
  icon,
  empty,
  lists,
}: {
  title: string
  icon: IconName
  empty: string
  lists: Parameters<typeof ListCard>[0]['list'][]
}) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-ink">
        <Icon name={icon} size={17} className="text-ink-3" />
        {title}
      </h2>
      {lists.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line-strong bg-surface/60 px-4 py-6 text-center text-sm text-ink-2">
          {empty}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <ListCard key={list.id} list={list} />
          ))}
        </div>
      )}
    </section>
  )
}
