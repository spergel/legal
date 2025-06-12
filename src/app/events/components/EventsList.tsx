'use client';

import Link from 'next/link';
import { Event, Location } from '@/types';
import { useState } from 'react';
import EventDialog from '@/components/EventDialog';
import EventsFilter from '@/components/EventsFilter';

interface EventsListProps {
  events: (Event & {
    formattedStartDate: string;
    formattedEndDate: string | null;
  })[];
  locations: Location[];
}

// Helper to get a snippet of the description
function getDescriptionSnippet(htmlDescription: string | null | undefined, maxLength: number = 100): string {
  if (!htmlDescription) return 'No description available.';
  // Strip HTML tags (basic version)
  const text = htmlDescription.replace(/<[^>]*>/g, '');
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export default function EventsList({ events: initialEvents, locations }: EventsListProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [filteredEvents, setFilteredEvents] = useState(initialEvents);

  if (!initialEvents || initialEvents.length === 0) {
    return <p className="text-gray-400">No events found at the moment. Check back soon!</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-amber-800">Events</h1>
        <Link href="/" className="text-amber-800 hover:text-amber-700 font-medium">
          &larr; Back to Home
        </Link>
      </div>
      
      <EventsFilter 
        events={initialEvents}
        onFilteredEvents={setFilteredEvents}
        className="mb-8"
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => {
          const location = event.locationId ? locations.find(loc => loc.id === event.locationId) : null;
          const displayLocation = location ? `${location.name}${location.city ? `, ${location.city}` : ''}` : (event.metadata?.venue?.name || 'Online/TBD');
          const cleCredits = event.metadata?.cle_credits;
          
          return (
            <div key={event.id} className="block bg-amber-50 rounded-lg shadow-lg hover:shadow-amber-200/30 transition-shadow duration-300 overflow-hidden border border-amber-200">
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-amber-900 mb-2 truncate" title={event.name}>{event.name}</h2>
                <p className="text-sm text-amber-800 mb-1">
                  <span className="font-semibold">Date:</span> {event.formattedStartDate}
                </p>
                <p className="text-sm text-amber-800 mb-3">
                  <span className="font-semibold">Location:</span> {displayLocation}
                </p>
                {cleCredits && (
                  <p className="text-sm text-amber-700 mb-3">
                    <span className="font-semibold">CLE Credits:</span> {cleCredits}
                  </p>
                )}
                <p className="text-amber-900 text-sm mb-4 h-16 overflow-hidden">
                  {getDescriptionSnippet(event.description)}
                </p>
                <div className="mb-3">
                  {event.category?.slice(0, 3).map(cat => (
                    <span key={cat} className="inline-block bg-amber-100 text-amber-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">
                      {cat}
                    </span>
                  ))}
                </div>
                <button 
                  onClick={() => setSelectedEventId(event.id)}
                  className="text-right text-amber-800 hover:text-amber-700 font-medium w-full"
                >
                  View Details &rarr;
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedEventId && (
        <EventDialog 
          eventId={selectedEventId} 
          onClose={() => setSelectedEventId(null)} 
        />
      )}
    </div>
  );
} 