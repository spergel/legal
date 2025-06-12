import { Inter } from "next/font/google";
import Link from 'next/link';
import MobileMenu from '@/components/MobileMenu';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen bg-[#f4e4bc] text-gray-800`}>
        <MobileMenu />
        <header className="bg-[#8b7355] shadow-md sticky top-0 z-30">
          <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-[#f4e4bc] hover:text-white">
              NYC Legal Events
            </Link>
            {/* Desktop Nav */}
            <div className="space-x-4 hidden md:flex">
              <Link href="/" className="text-[#f4e4bc] hover:text-white">Home</Link>
              <Link href="/events" className="text-[#f4e4bc] hover:text-white">Events</Link>
              <Link href="/resources" className="text-[#f4e4bc] hover:text-white">Resources</Link>
              <Link href="/about" className="text-[#f4e4bc] hover:text-white">About</Link>
            </div>
            {/* Mobile Menu Button */}
            <button
              className="md:hidden flex flex-col justify-center items-center w-10 h-10 focus:outline-none"
              aria-label="Open menu"
              id="mobile-menu-button"
            >
              <span className="block w-6 h-0.5 bg-[#f4e4bc] mb-1"></span>
              <span className="block w-6 h-0.5 bg-[#f4e4bc] mb-1"></span>
              <span className="block w-6 h-0.5 bg-[#f4e4bc]"></span>
            </button>
          </nav>
          {/* Mobile Menu */}
          <div className="md:hidden bg-[#8b7355] border-t border-[#6b5b43] px-6 py-4 space-y-2 hidden" id="mobile-menu">
            <Link href="/" className="block py-2 text-[#f4e4bc] hover:text-white">Home</Link>
            <Link href="/events" className="block py-2 text-[#f4e4bc] hover:text-white">Events</Link>
            <Link href="/resources" className="block py-2 text-[#f4e4bc] hover:text-white">Resources</Link>
            <Link href="/about" className="block py-2 text-[#f4e4bc] hover:text-white">About</Link>
          </div>
        </header>
        <main className="flex-grow container mx-auto px-6 py-8">
          {children}
        </main>
        <footer className="bg-[#8b7355] text-[#f4e4bc] text-center p-4 mt-auto">
          <p>&copy; {new Date().getFullYear()} NYC Legal Events. All rights reserved.</p>
          <p>Your source for legal events and resources in New York City.</p>
        </footer>
      </body>
    </html>
  );
}
