import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AdminProductsClient } from '@/components/admin-products-client'

export default async function AdminProductsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!user.roles.includes('ADMIN')) redirect('/')

  const [categories, products] = await Promise.all([
    prisma.category.findMany({ orderBy: { order: 'asc' } }),
    prisma.product.findMany({
      orderBy: [{ category: { order: 'asc' } }, { order: 'asc' }, { name: 'asc' }],
      include: { category: true, _count: { select: { items: true } } },
    }),
  ])

  const serialized = products.map((p) => ({
    id: p.id,
    name: p.name,
    icon: p.icon,
    visible: p.visible,
    order: p.order,
    categoryId: p.categoryId,
    categoryName: p.category.name,
    usageCount: p._count.items,
  }))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-ink">Catálogo de productos</h1>
        <p className="mt-0.5 text-sm text-ink-2">
          Elige qué productos se muestran a los usuarios al crear listas
        </p>
      </div>
      <AdminProductsClient
        categories={categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon }))}
        initialProducts={serialized}
      />
    </div>
  )
}
