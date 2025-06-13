import { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'

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
      <head>
        {/* Google Fonts for Papyrus-like look */}
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#f6ecd9] text-[#5b4636] font-serif" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
        <nav className="bg-[#bfa980] shadow-md border-b-4 border-[#c8b08a] py-4 mb-8">
          <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-2 px-4">
            <Link href="/" className="text-3xl font-bold tracking-widest drop-shadow-sm" style={{ fontFamily: 'Cormorant Garamond, serif', letterSpacing: '0.08em' }}>
              NYC Legal Calendar
            </Link>
            <div className="flex space-x-6 mt-2 md:mt-0">
              <Link href="/events" className="text-lg font-semibold hover:underline underline-offset-4 decoration-[#e2c799] transition-colors duration-200">
                Events
              </Link>
              <Link href="/resources" className="text-lg font-semibold hover:underline underline-offset-4 decoration-[#e2c799] transition-colors duration-200">
                Resources
              </Link>
              <Link href="/about" className="text-lg font-semibold hover:underline underline-offset-4 decoration-[#e2c799] transition-colors duration-200">
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
