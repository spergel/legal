import { getAllCommunities } from '@/lib/data-loader';
import { Metadata } from 'next';
import CommunitiesList from './components/CommunitiesList';

export const metadata: Metadata = {
  title: 'Legal Resources & Organizations | NYC Legal Calendar',
  description: 'Find legal resources, bar associations, law schools, and organizations for the public and legal professionals in NYC.',
};

export default function Resources() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">Resources</h1>
      <p className="text-lg mb-4">Coming soon: Legal resources and organizations in New York City.</p>
    </div>
  )
} 