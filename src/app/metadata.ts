import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Youth NYC - Summer Camps & Scout Troops',
  description: 'Find summer camps and scout troops across New York City. Discover the perfect activities for your child.',
  metadataBase: new URL('https://youth.somethingtodo.nyc'),
  openGraph: {
    title: 'Youth NYC - Summer Camps & Scout Troops',
    description: 'Find summer camps and scout troops across New York City. Discover the perfect activities for your child.',
    url: 'https://youth.somethingtodo.nyc',
    siteName: 'Youth NYC',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Youth NYC - Summer Camps & Scout Troops',
    description: 'Find summer camps and scout troops across New York City. Discover the perfect activities for your child.',
  },
  robots: {
    index: true,
    follow: true,
  },
} 