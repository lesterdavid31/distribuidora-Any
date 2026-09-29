import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { SESSION_COOKIE, verifySessionToken, type SessionPayload } from './session'

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

/** Sesión actual (server components / route handlers). null si no hay sesión válida */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySessionToken(token)
}

/** Usuario actual desde la BD (datos frescos: activo, roles) */
export async function getCurrentUser() {
  const session = await getSession()
  if (!session) return null
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: { roles: { include: { role: true } } },
  })
  if (!user || !user.active) return null
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles.map((r) => r.role.name),
  }
}

export function hasRole(user: { roles: string[] } | null, role: string) {
  return !!user && user.roles.includes(role)
}
