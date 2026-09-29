import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NewListForm } from '@/components/new-list-form'

export default async function NewListPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const categories = await prisma.category.findMany({
    orderBy: { order: 'asc' },
    include: {
      products: {
        where: { visible: true },
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
        select: { id: true, name: true, icon: true, categoryId: true },
      },
    },
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-ink">Nueva lista de compras</h1>
        <p className="mt-0.5 text-sm text-ink-2">
          Elige los productos del catálogo y agrégalos a tu lista
        </p>
      </div>
      <NewListForm categories={categories} />
    </div>
  )
}
