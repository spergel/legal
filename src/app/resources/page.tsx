import { getAllCommunities } from '@/lib/data-loader';
import { Metadata } from 'next';
import CommunitiesList from './components/CommunitiesList';

export const metadata: Metadata = {
  title: 'Legal Resources & Organizations | NYC Legal Calendar',
  description: 'Find legal resources, bar associations, law schools, and organizations for the public and legal professionals in NYC.',
};

export default async function Resources() {
  const communities = await getAllCommunities();
  return (
    <div className="container mx-auto px-4 py-8">
      <CommunitiesList communities={communities} />
    </div>
  );
} 