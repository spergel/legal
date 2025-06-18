'use client';

import Link from 'next/link';
import { Event } from '@/types';
import { useState, useEffect } from 'react';
import EventDialog from '@/components/EventDialog';
import EventsFilter from '@/components/EventsFilter';

interface EventsListProps {
  events: (Event & {
    formattedStartDate: string;
    formattedEndDate: string | null;
  })[];
  showBookmarkedOnly?: boolean;
}

// Helper to get a snippet of the description
function getDescriptionSnippet(htmlDescription: string | null | undefined, maxLength: number = 100): string {
  if (!htmlDescription) return 'No description available.';
  // Strip HTML tags (basic version)
  const text = htmlDescription.replace(/<[^>]*>/g, '');
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export default function EventsList({ events: initialEvents, showBookmarkedOnly = false }: EventsListProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [filteredEvents, setFilteredEvents] = useState(initialEvents);
  const [bookmarked, setBookmarked] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('bookmarkedEvents');
    setBookmarked(saved ? JSON.parse(saved) : []);
  }, []);

  function toggleBookmark(eventId: string) {
    setBookmarked(prev => {
      const updated = prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId];
      localStorage.setItem('bookmarkedEvents', JSON.stringify(updated));
      return updated;
    });
  }

  // Filter events if showBookmarkedOnly is enabled
  const eventsToShow = showBookmarkedOnly
    ? filteredEvents.filter(event => bookmarked.includes(event.id))
    : filteredEvents;

  // Export URLs for bookmarked events
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const bookmarkedParam = bookmarked.length ? `id=${bookmarked.join(',')}` : '';
  const icsUrl = `${baseUrl}/api/events/ics${bookmarkedParam ? '?' + bookmarkedParam : ''}`;
  const rssUrl = `${baseUrl}/api/rss${bookmarkedParam ? '?' + bookmarkedParam : ''}`;

  if (!initialEvents || initialEvents.length === 0) {
    return <p className="text-gray-400">No events found at the moment. Check back soon!</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-amber-800">Events</h1>
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
              {/* Bookmark button */}
              <button
                onClick={e => { e.stopPropagation(); toggleBookmark(event.id); }}
                className="absolute top-4 right-4 text-2xl focus:outline-none"
                title={bookmarked.includes(event.id) ? 'Remove Bookmark' : 'Bookmark Event'}
                aria-label={bookmarked.includes(event.id) ? 'Remove Bookmark' : 'Bookmark Event'}
              >
                {bookmarked.includes(event.id)
                  ? <span className="text-yellow-500">★</span>
                  : <span className="text-gray-400">☆</span>
                }
              </button>
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