'use client';

import { useState, useEffect } from 'react';
import { Event } from '@/types';
import { getAllEvents } from '@/lib/data-loader';
import Link from 'next/link';
import EventDialog from './EventDialog';

export default function EventsCarousel() {
  const [todayEvents, setTodayEvents] = useState<Event[]>([]);
  const [tomorrowEvents, setTomorrowEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvents() {
      const events = await getAllEvents();
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Filter events for today
      const today = events.filter(event => {
        const eventDate = new Date(event.startDate);
        return eventDate.toDateString() === now.toDateString();
      });

      // Filter events for tomorrow
      const tomorrowEvents = events.filter(event => {
        const eventDate = new Date(event.startDate);
        return eventDate.toDateString() === tomorrow.toDateString();
      });

      setTodayEvents(today);
      setTomorrowEvents(tomorrowEvents);
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
        {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

  return (
    <div className="space-y-8">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-amber-900">Today&apos;s Events</h2>
          <Link 
            href="/events" 
            className="text-amber-800 hover:text-amber-700 font-medium"
          >
            See all events →
          </Link>
        </div>
        {todayEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {todayEvents.map(renderEventCard)}
          </div>
        ) : (
          <div className="bg-amber-50 rounded-lg p-6 text-center border border-amber-200">
            <p className="text-amber-800">No events scheduled for today</p>
          </div>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-amber-900">Tomorrow&apos;s Events</h2>
          <Link 
            href="/events" 
            className="text-amber-800 hover:text-amber-700 font-medium"
          >
            See all events →
          </Link>
        </div>
        {tomorrowEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tomorrowEvents.map(renderEventCard)}
          </div>
        ) : (
          <div className="bg-amber-50 rounded-lg p-6 text-center border border-amber-200">
            <p className="text-amber-800">No events scheduled for tomorrow</p>
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