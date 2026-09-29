import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, isResponse } from '@/lib/api-helpers'

/** Usuarios activos (para asignar comprador / compartir lista) */
export async function GET() {
  const user = await requireUser()
  if (isResponse(user)) return user

  const users = await prisma.user.findMany({
    where: { active: true, id: { not: user.id } },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      roles: { select: { role: { select: { name: true } } } },
    },
  })
  return NextResponse.json({
    users: users.map((u) => ({ id: u.id, name: u.name, roles: u.roles.map((r) => r.role.name) })),
  })
}
