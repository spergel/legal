'use client';

import Link from 'next/link';
import { Community } from '@/types';
import { useState } from 'react';
import CommunitiesFilter from '@/components/CommunitiesFilter';

interface CommunitiesListProps {
  communities: Community[];
}

// Helper to get a snippet of the description
function getDescriptionSnippet(htmlDescription: string | null | undefined, maxLength: number = 100): string {
  if (!htmlDescription) return 'No description available.';
  // Strip HTML tags (basic version)
  const text = htmlDescription.replace(/<[^>]*>/g, '');
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export default function CommunitiesList({ communities: initialCommunities }: CommunitiesListProps) {
  const [filteredCommunities, setFilteredCommunities] = useState(initialCommunities);

  if (!initialCommunities || initialCommunities.length === 0) {
    return <p className="text-gray-400">No communities found at the moment. Check back soon!</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-amber-800">Legal Resources & Organizations</h1>
        <Link href="/" className="text-amber-800 hover:text-amber-700 font-medium">
          &larr; Back to Home
        </Link>
      </div>
      
      <CommunitiesFilter 
        communities={initialCommunities}
        onFilteredCommunities={setFilteredCommunities}
        className="mb-8"
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCommunities.map((community) => {
          const displayLocation = community.location 
            ? `${community.location.city || ''}${community.location.state ? `, ${community.location.state}` : ''}`
            : 'Online';
          
          return (
            <div key={community.id} className="block bg-amber-50 rounded-lg shadow-lg hover:shadow-amber-200/30 transition-shadow duration-300 overflow-hidden border border-amber-200">
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-amber-900 mb-2 truncate" title={community.name}>
                  {community.name}
                </h2>
                <p className="text-sm text-amber-800 mb-3">
                  <span className="font-semibold">Location:</span> {displayLocation}
                </p>
                <p className="text-amber-900 text-sm mb-4 h-16 overflow-hidden">
                  {getDescriptionSnippet(community.description)}
                </p>
                <div className="mb-3">
                  {community.category?.slice(0, 3).map(cat => (
                    <span key={cat} className="inline-block bg-amber-100 text-amber-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">
                      {cat}
                    </span>
                  ))}
                </div>
                {community.url && (
                  <a 
                    href={community.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-right text-amber-800 hover:text-amber-700 font-medium block"
                  >
                    Visit Website &rarr;
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 