import { getAllEvents, getAllLocations, formatDate } from '@/lib/data-loader';
import EventsList from './components/EventsList';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events | NYC Legal Calendar',
  description: 'Discover legal events, CLE programs, and professional development opportunities in New York City.',
};

export default async function Events() {
  const events = await getAllEvents();
  const locations = await getAllLocations();

  // Format dates for display
  const formattedEvents = await Promise.all(events.map(async event => ({
    ...event,
    formattedStartDate: await formatDate(event.startDate),
    formattedEndDate: event.endDate ? await formatDate(event.endDate) : null,
  })));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">Events</h1>
      <p className="text-lg mb-4">Coming soon: A calendar of legal events in New York City.</p>
      <EventsList events={formattedEvents} locations={locations} />
    </div>
  );
} 