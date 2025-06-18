'use client';

import { getCommunityById, getAllEvents, formatDate } from '@/lib/data-loader';
import { Community, Event } from '@/types';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface CommunityDialogProps {
  communityId: string;
  onClose: () => void;
}

export default function CommunityDialog({ communityId, onClose }: CommunityDialogProps) {
  const [community, setCommunity] = useState<Community | null>(null);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    async function loadData() {
      const communityData = await getCommunityById(communityId);
      if (!communityData) return;
      
      setCommunity(communityData);

      const allEvents = await getAllEvents();
      const communityEvents = allEvents.filter(event => event.communityId === communityId);
      setEvents(communityEvents);
    }

    loadData();
  }, [communityId]);

  if (!community) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 p-6 sm:p-8 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-teal-400 break-words">{community.name}</h1>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-semibold text-gray-100 mb-3">About</h2>
            {community.description ? (
              <div 
                className="prose prose-invert max-w-none text-gray-300 links:text-teal-400 hover:links:text-teal-300"
                dangerouslySetInnerHTML={{ __html: community.description }}
              />
            ) : (
              <p className="text-gray-400">No detailed description available.</p>
            )}
          </div>

          <div className="md:col-span-1 space-y-6">
            {community.category && community.category.length > 0 && (
              <div className="bg-gray-700 p-4 rounded-lg shadow">
                <h3 className="text-xl font-semibold text-teal-300 mb-3">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {community.category.map(cat => (
                    <span key={cat} className="bg-gray-600 text-teal-300 text-sm px-3 py-1 rounded-full">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {community.location && (
              <div className="bg-gray-700 p-4 rounded-lg shadow">
                <h3 className="text-xl font-semibold text-teal-300 mb-3">Location</h3>
                {community.location.address && 
                  <p className="text-gray-300">{community.location.address}</p>
                }
                <p className="text-gray-300">
                  {community.location.city}
                  {community.location.city && community.location.state ? ', ' : ''}
                  {community.location.state} {community.location.zip}
                </p>
              </div>
            )}

            {community.url && (
              <div className="bg-gray-700 p-4 rounded-lg shadow">
                <h3 className="text-xl font-semibold text-teal-300 mb-3">Website</h3>
                <a 
                  href={community.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-block bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                >
                  Visit Website &rarr;
                </a>
              </div>
            )}

            {events.length > 0 && (
              <div className="bg-gray-700 p-4 rounded-lg shadow">
                <h3 className="text-xl font-semibold text-teal-300 mb-3">Upcoming Events</h3>
                <div className="space-y-4">
                  {events.map(event => (
                    <Link 
                      href={`/events/${event.id}`} 
                      key={event.id}
                      className="block bg-gray-600 p-3 rounded-lg hover:bg-gray-500 transition-colors duration-300"
                    >
                      <h4 className="text-purple-300 font-semibold mb-1">{event.name}</h4>
                      <p className="text-sm text-gray-300">
                        {formatDate(event.startDate.toISOString())}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 