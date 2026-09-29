import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ListDetailClient, type SerializableList } from '@/components/list-detail-client'

export default async function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const { id } = await params

  const list = await prisma.purchaseList.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true } },
      buyer: { select: { id: true, name: true } },
      items: {
        orderBy: [{ product: { category: { order: 'asc' } } }, { product: { order: 'asc' } }],
        include: { product: { include: { category: true } } },
      },
      shares: { include: { sharedWith: { select: { id: true, name: true } } } },
    },
  })
  if (!list) notFound()

  const isAdmin = user.roles.includes('ADMIN')
  const canView =
    isAdmin ||
    list.creatorId === user.id ||
    list.buyerId === user.id ||
    list.shares.some((s) => s.sharedWithId === user.id)
  if (!canView) redirect('/')

  const canEdit = isAdmin || list.creatorId === user.id || list.buyerId === user.id
  const canShare = isAdmin || list.creatorId === user.id

  // Serializar (Decimal no es transferable a Client Components)
  const serialized: SerializableList = {
    id: list.id,
    title: list.title,
    status: list.status,
    purchaseDate: list.purchaseDate?.toISOString() ?? null,
    createdAt: list.createdAt.toISOString(),
    creator: list.creator,
    buyer: list.buyer,
    shares: list.shares.map((s) => ({ id: s.id, sharedWith: s.sharedWith })),
    items: list.items.map((i) => ({
      id: i.id,
      checked: i.checked,
      quantity: i.quantity !== null ? Number(i.quantity) : null,
      unit: i.unit,
      purchasePrice: i.purchasePrice !== null ? Number(i.purchasePrice) : null,
      salePrice: i.salePrice !== null ? Number(i.salePrice) : null,
      product: {
        name: i.product.name,
        icon: i.product.icon,
        category: { name: i.product.category.name, icon: i.product.category.icon },
      },
    })),
  }

  return (
    <ListDetailClient
      list={serialized}
      canEdit={canEdit}
      canShare={canShare}
      isCreator={list.creatorId === user.id}
      isAdmin={isAdmin}
    />
  )
}
