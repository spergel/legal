import { getAllCommunities } from '@/lib/data-loader';
import { Metadata } from 'next';
import CommunitiesList from './components/CommunitiesList';

export const metadata: Metadata = {
  title: 'Resources & Organizations | Event Calendar',
  description: 'Find resources, organizations, and helpful links for your community.',
};

export default async function Resources() {
  const communities = await getAllCommunities();
  return (
    <div className="container mx-auto px-4 py-8">
      <CommunitiesList communities={communities} />
    </div>
  );
} 