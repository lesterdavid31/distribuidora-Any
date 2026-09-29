import { SignJWT, jwtVerify } from 'jose'

export const SESSION_COOKIE = 'mercado_session'
const SESSION_DAYS = 7

function getSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET no está definido en .env')
  return new TextEncoder().encode(secret)
}

export type SessionPayload = {
  sub: string
  name: string
  email: string
  roles: string[]
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({ name: payload.name, email: payload.email, roles: payload.roles })
    .setSubject(payload.sub)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret())
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (!payload.sub) return null
    return {
      sub: payload.sub,
      name: payload.name as string,
      email: payload.email as string,
      roles: (payload.roles as string[]) ?? [],
    }
  } catch {
    return null
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_DAYS * 24 * 60 * 60,
}
