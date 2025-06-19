import { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AuthNav from '@/components/AuthNav';
import SessionProviderWrapper from '@/components/SessionProviderWrapper';

export const metadata: Metadata = {
  title: 'Legal Events Calendar',
  description: 'Discover events, programs, and opportunities. Easily add your own scrapers and customize branding.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions);
  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
  const isAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email);

  return (
    <html lang="en">
      <head>
        {/* Google Fonts for classic look. Change or add your own! */}
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#f6ecd9] text-[#5b4636] font-serif" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
        <SessionProviderWrapper session={session}>
          <nav className="bg-[#bfa980] shadow-md border-b-4 border-[#c8b08a] py-4 mb-8">
            <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-2 px-4">
              <Link href="/" className="text-3xl font-bold tracking-widest drop-shadow-sm" style={{ fontFamily: 'Cormorant Garamond, serif', letterSpacing: '0.08em' }}>
                Event Calendar
              </Link>
              <div className="flex space-x-6 mt-2 md:mt-0 items-center">
                <Link href="/events" className="text-lg font-semibold hover:underline underline-offset-4 decoration-[#e2c799] transition-colors duration-200">
                  Events
                </Link>
                {session?.user && (
                  <Link href="/starred" className="text-lg font-semibold hover:underline underline-offset-4 decoration-[#e2c799] transition-colors duration-200">
                    Starred Events
                  </Link>
                )}
                <Link href="/resources" className="text-lg font-semibold hover:underline underline-offset-4 decoration-[#e2c799] transition-colors duration-200">
                  Resources
                </Link>
                <Link href="/about" className="text-lg font-semibold hover:underline underline-offset-4 decoration-[#e2c799] transition-colors duration-200">
                  About
                </Link>
                {session?.user && (
                  <Link href="/submit" className="text-lg font-semibold hover:underline underline-offset-4 decoration-[#e2c799] transition-colors duration-200">
                    Submit Event
                  </Link>
                )}
                {isAdmin && (
                  <Link href="/admin" className="text-lg font-semibold hover:underline underline-offset-4 decoration-[#e2c799] transition-colors duration-200">
                    Admin
                  </Link>
                )}
                <AuthNav session={session} />
              </div>
            </div>
          </nav>
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </SessionProviderWrapper>
      </body>
    </html>
  )
}
