import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Byte Hub NYC',
  description: 'Learn about Byte Hub NYC and our mission to connect young tech enthusiasts in New York City with events and communities.',
};

export default function About() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">About</h1>
      <p className="text-lg mb-4">This is a calendar of legal events in New York City.</p>
    </div>
  )
} 