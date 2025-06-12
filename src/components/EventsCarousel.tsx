'use client';

import { useState, useEffect } from 'react';
import { Event } from '@/types';
import { getAllEvents } from '@/lib/data-loader';
import Link from 'next/link';
import EventDialog from './EventDialog';

function getStartOfWeek(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // Sunday as start
  return d;
}

function getEndOfWeek(date: Date) {
  const d = getStartOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

export default function EventsCarousel() {
  const [thisWeekEvents, setThisWeekEvents] = useState<Event[]>([]);
  const [nextWeekEvents, setNextWeekEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        setIsLoading(true);
        setError(null);
        const events = await getAllEvents();
        const now = new Date();
        const startOfThisWeek = getStartOfWeek(now);
        const endOfThisWeek = getEndOfWeek(now);
        const startOfNextWeek = new Date(startOfThisWeek);
        startOfNextWeek.setDate(startOfThisWeek.getDate() + 7);
        const endOfNextWeek = new Date(endOfThisWeek);
        endOfNextWeek.setDate(endOfThisWeek.getDate() + 7);

        // This week
        const thisWeek = events.filter(event => {
          const eventDate = new Date(event.startDate);
          return eventDate >= startOfThisWeek && eventDate <= endOfThisWeek;
        });
        // Next week
        const nextWeek = events.filter(event => {
          const eventDate = new Date(event.startDate);
          return eventDate >= startOfNextWeek && eventDate <= endOfNextWeek;
        });
        setThisWeekEvents(thisWeek);
        setNextWeekEvents(nextWeek);
      } catch (err) {
        console.error('Error loading events:', err);
        setError('Failed to load events. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    loadEvents();
  }, []);

  const renderEventCard = (event: Event) => (
    <div 
      key={event.id}
      className="bg-amber-50 rounded-lg shadow-lg p-4 cursor-pointer hover:bg-amber-100 transition-colors border border-amber-200"
      onClick={() => setSelectedEventId(event.id)}
    >
      {event.image && (
        <img 
          src={event.image} 
          alt={event.name} 
          className="w-full h-48 object-cover rounded-lg mb-4"
        />
      )}
      <h3 className="text-xl font-semibold text-amber-900 mb-2">{event.name}</h3>
      <p className="text-amber-800 text-sm mb-2">
        {new Date(event.startDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
      </p>
      {event.metadata?.cle_credits && (
        <p className="text-amber-700 text-sm mb-2">
          CLE Credits: {event.metadata.cle_credits}
        </p>
      )}
      {event.price && (event.price.type?.toLowerCase() === 'free' || event.price.amount === 0) ? (
        <span className="text-green-700 font-semibold">FREE</span>
      ) : event.price && (
        <span className="text-amber-800 font-semibold">
          {event.price.currency}{event.price.amount.toFixed(2)}
        </span>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-amber-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-amber-100 rounded-lg p-4 h-64"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div className="bg-amber-800 rounded-xl px-8 py-10 mb-8 shadow flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight drop-shadow">Legal Events Calendar</h1>
        <p className="text-lg md:text-xl text-amber-100 mb-4">Welcome to the NYC Legal Events Calendar.</p>
        <div className="flex flex-col md:flex-row gap-4 w-full justify-center">
          <Link href="/events" className="bg-white text-amber-800 font-semibold px-6 py-2 rounded shadow hover:bg-amber-100 transition">Browse All Events</Link>
          <Link href="/resources" className="bg-amber-100 text-amber-900 font-semibold px-6 py-2 rounded shadow hover:bg-white transition">Legal Resources</Link>
        </div>
      </div>

      {/* This Week's Events */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-amber-900">This Week&apos;s Events</h2>
          <Link 
            href="/events" 
            className="text-amber-800 hover:text-amber-700 font-medium"
          >
            See all events →
          </Link>
        </div>
        {thisWeekEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {thisWeekEvents.map(renderEventCard)}
          </div>
        ) : (
          <div className="bg-amber-50 rounded-lg p-6 text-center border border-amber-200">
            <p className="text-amber-800">No events scheduled for this week</p>
          </div>
        )}
      </div>

      {/* Next Week's Events */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-amber-900">Next Week&apos;s Events</h2>
          <Link 
            href="/events" 
            className="text-amber-800 hover:text-amber-700 font-medium"
          >
            See all events →
          </Link>
        </div>
        {nextWeekEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nextWeekEvents.map(renderEventCard)}
          </div>
        ) : (
          <div className="bg-amber-50 rounded-lg p-6 text-center border border-amber-200">
            <p className="text-amber-800">No events scheduled for next week</p>
          </div>
        )}
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