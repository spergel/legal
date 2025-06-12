import { getAllEvents, getAllLocations, formatDate } from '@/lib/data-loader';
import EventsList from './components/EventsList';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events | NYC Legal Calendar',
  description: 'Discover legal events, CLE programs, and professional development opportunities in New York City.',
};

export default async function EventsPage() {
  const [events, locations] = await Promise.all([
    getAllEvents(),
    getAllLocations()
  ]);

  // Format dates on the server side
  const eventsWithFormattedDates = await Promise.all(events.map(async event => ({
    ...event,
    formattedStartDate: await formatDate(event.startDate),
    formattedEndDate: event.endDate ? await formatDate(event.endDate) : null
  })));

  return <EventsList events={eventsWithFormattedDates} locations={locations} />;
} 