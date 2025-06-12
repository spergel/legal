import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NYC Legal Calendar',
  description: 'Discover legal events, CLE programs, and professional development opportunities in New York City.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-amber-800 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="text-xl font-bold">
              NYC Legal Calendar
            </Link>
            <div className="space-x-4">
              <Link href="/events" className="hover:text-amber-200">
                Events
              </Link>
              <Link href="/resources" className="hover:text-amber-200">
                Resources
              </Link>
              <Link href="/about" className="hover:text-amber-200">
                About
              </Link>
            </div>
          </div>
        </nav>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
