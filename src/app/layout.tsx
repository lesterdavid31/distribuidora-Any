import type { Metadata, Viewport } from 'next'
import { Onest } from 'next/font/google'
import { getCurrentUser } from '@/lib/auth'
import { Navbar } from '@/components/navbar'
import './globals.css'

const onest = Onest({ subsets: ['latin'], variable: '--font-onest' })

export const metadata: Metadata = {
  title: 'Verdurería Any — Registro de compras',
  description: 'Registro de compras de mercadería: verduras, especias, legumbres y granos',
}

export const viewport: Viewport = {
  themeColor: '#f5f7f4',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  return (
    <html lang="es" className={onest.variable}>
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">
        {user ? (
          <>
            <Navbar user={user} />
            <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 sm:px-6 md:pb-16 md:pt-8">
              {children}
            </main>
          </>
        ) : (
          children
        )}
      </body>
    </html>
  )
}
