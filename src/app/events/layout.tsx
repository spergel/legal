import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events | Event Calendar',
  description: 'Browse and discover events, programs, and opportunities.',
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Main events layout. Customize styles and structure as needed. */}
      {children}
    </div>
  );
} 