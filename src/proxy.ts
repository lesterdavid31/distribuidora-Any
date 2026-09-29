import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = request.cookies.get(SESSION_COOKIE)?.value
  const session = token ? await verifySessionToken(token) : null

  // API routes: 401 JSON en lugar de redirect
  if (pathname.startsWith('/api/')) {
    if (pathname === '/api/auth/login') return NextResponse.next()
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    return NextResponse.next()
  }

  // Páginas: redirect a /login
  if (!session && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (session && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|ico|jpg|webp)$).*)'],
}
