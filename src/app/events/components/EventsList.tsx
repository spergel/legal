'use client';

import Link from 'next/link';
import { Event } from '@/types';
import { useState, useEffect } from 'react';
import EventDialog from '@/components/EventDialog';
import EventsFilter from '@/components/EventsFilter';
import StarButton from '@/components/StarButton';

interface EventsListProps {
  events: (Event & {
    formattedStartDate: string;
    formattedEndDate: string | null;
  })[];
  showStarredOnly?: boolean;
}

// Helper to get a snippet of the description
function getDescriptionSnippet(htmlDescription: string | null | undefined, maxLength: number = 100): string {
  if (!htmlDescription) return 'No description available.';
  // Strip HTML tags (basic version)
  const text = htmlDescription.replace(/<[^>]*>/g, '');
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export default function EventsList({ events: initialEvents, showStarredOnly = false }: EventsListProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [filteredEvents, setFilteredEvents] = useState(initialEvents || []);
  const [starredEventIds, setStarredEventIds] = useState<string[]>([]);
  const [isLoadingStarred, setIsLoadingStarred] = useState(false);

  // Update filtered events when initialEvents changes
  useEffect(() => {
    setFilteredEvents(initialEvents || []);
  }, [initialEvents]);

  // Load starred events for filtering
  useEffect(() => {
    if (showStarredOnly) {
      setIsLoadingStarred(true);
      fetch('/api/user/starred-events')
        .then(res => res.json())
        .then(data => {
          if (data.events && Array.isArray(data.events)) {
            setStarredEventIds(data.events.map((event: Event) => event.id));
          } else {
            setStarredEventIds([]);
          }
        })
        .catch(() => setStarredEventIds([]))
        .finally(() => setIsLoadingStarred(false));
    }
  }, [showStarredOnly]);

  // Filter events if showStarredOnly is enabled
  const eventsToShow = showStarredOnly
    ? filteredEvents.filter(event => starredEventIds.includes(event.id))
    : filteredEvents;

  // Export URLs for starred events
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const starredParam = starredEventIds.length ? `id=${starredEventIds.join(',')}` : '';
  const icsUrl = `${baseUrl}/api/events/ics${starredParam ? '?' + starredParam : ''}`;
  const rssUrl = `${baseUrl}/api/rss${starredParam ? '?' + starredParam : ''}`;

  if (showStarredOnly && isLoadingStarred) {
    return <p className="text-gray-400">Loading starred events...</p>;
  }

  if (!initialEvents || initialEvents.length === 0) {
    return <p className="text-gray-400">No events found at the moment. Check back soon!</p>;
  }

  if (showStarredOnly && eventsToShow.length === 0) {
    return <p className="text-gray-400">No starred events found. Star some events to see them here!</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-amber-800">
          {showStarredOnly ? 'Starred Events' : 'Events'}
        </h1>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-amber-800 hover:text-amber-700 font-medium">
            &larr; Back to Home
          </Link>
        </div>
      </div>
      
      <EventsFilter 
        events={initialEvents}
        onFilteredEvents={setFilteredEvents}
        className="mb-8"
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {eventsToShow.map((event) => (
          <div
            key={event.id}
            className="block bg-amber-50 rounded-lg shadow-lg hover:shadow-amber-200/30 transition-shadow duration-300 overflow-hidden border border-amber-200 cursor-pointer"
            onClick={() => setSelectedEventId(event.id)}
          >
            <div className="p-6 relative">
              {/* Star button */}
              <div className="absolute top-4 right-4">
                <StarButton eventId={event.id} />
              </div>
              
              <h2 className="text-2xl font-semibold text-amber-900 mb-2 truncate" title={event.name}>{event.name}</h2>
              <p className="text-sm text-amber-800 mb-1">
                <span className="font-semibold">Date:</span> {event.formattedStartDate}
              </p>
              <p className="text-sm text-amber-800 mb-3">
                <span className="font-semibold">Location:</span> {event.locationName || 'Online/TBD'}
              </p>
              {event.cleCredits && (
                <p className="text-sm text-amber-700 mb-3">
                  <span className="font-semibold">CLE Credits:</span> {event.cleCredits}
                </p>
              )}
              <p className="text-amber-900 text-sm mb-4 h-16 overflow-hidden">
                {getDescriptionSnippet(event.description)}
              </p>
              {event.community && (
                <div className="mb-3">
                  <span className="inline-block bg-amber-100 text-amber-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">
                    {event.community.name}
                  </span>
                </div>
              )}
              <a
                href={event.url || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-right text-amber-800 hover:text-amber-700 font-medium w-full block ${event.url ? '' : 'opacity-50 pointer-events-none'}`}
                onClick={e => e.stopPropagation()}
              >
                Go to Link &rarr;
              </a>
            </div>
          </div>
        ))}
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