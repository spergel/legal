import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events | NYC Legal Calendar',
  description: 'Browse and discover legal events, CLE programs, and professional development opportunities for legal professionals in New York City.',
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 