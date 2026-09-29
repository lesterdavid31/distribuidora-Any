import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/** Catálogo visible para crear listas (cualquier usuario autenticado) */
export async function GET() {
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
  return NextResponse.json({ categories })
}
