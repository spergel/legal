import { getAllEvents, formatDate } from '@/lib/data-loader';
import EventsClientPage from './components/EventsClientPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events | Event Calendar',
  description: 'Discover events, programs, and opportunities.',
};

export default async function Events() {
  try {
    const events = await getAllEvents();

    // Format dates for display and serialize Date objects
    const formattedEvents = await Promise.all(events.map(async event => ({
      ...event,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate ? event.endDate.toISOString() : null,
      submittedAt: event.submittedAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      formattedStartDate: await formatDate(event.startDate.toISOString()),
      formattedEndDate: event.endDate ? await formatDate(event.endDate.toISOString()) : null,
    })));

    return <EventsClientPage events={formattedEvents} />;
  } catch (error) {
    console.error('Error loading events:', error);
    // Return empty array if there's an error
    return <EventsClientPage events={[]} />;
  }
} 