import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AdminUsersClient } from '@/components/admin-users-client'

export default async function AdminUsersPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!user.roles.includes('ADMIN')) redirect('/')

  const users = await prisma.user.findMany({
    orderBy: { name: 'asc' },
    include: {
      roles: { include: { role: true } },
      _count: { select: { createdLists: true, assignedLists: true } },
    },
  })

  const serialized = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    active: u.active,
    roles: u.roles.map((r) => r.role.name),
    createdLists: u._count.createdLists,
    assignedLists: u._count.assignedLists,
  }))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-ink">Usuarios y roles</h1>
        <p className="mt-0.5 text-sm text-ink-2">Crea usuarios y asígnales uno o varios roles</p>
      </div>
      <AdminUsersClient initialUsers={serialized} currentUserId={user.id} />
    </div>
  )
}
