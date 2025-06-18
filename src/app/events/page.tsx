import { getAllEvents, formatDate } from '@/lib/data-loader';
import EventsClientPage from './components/EventsClientPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events | Event Calendar',
  description: 'Discover events, programs, and opportunities.',
};

export default async function Events() {
  const events = await getAllEvents();

  // Format dates for display
  const formattedEvents = await Promise.all(events.map(async event => ({
    ...event,
    formattedStartDate: await formatDate(event.startDate.toISOString()),
    formattedEndDate: event.endDate ? await formatDate(event.endDate.toISOString()) : null,
  })));

  return <EventsClientPage events={formattedEvents} />;
} 