import { getAllEvents, formatDate, getAllCommunities } from '@/lib/data-loader';
import EventsClientPage from './components/EventsClientPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events | Event Calendar',
  description: 'Discover events, programs, and opportunities.',
};

export default async function Events() {
  try {
    console.log('Fetching events and communities...');
    const [events, communities] = await Promise.all([
      getAllEvents(),
      getAllCommunities(),
    ]);
    console.log('Raw events data:', events);
    console.log('Number of events:', events?.length || 0);
    console.log('Number of communities:', communities?.length || 0);

    // Ensure events is an array
    if (!Array.isArray(events)) {
      console.error('Events is not an array:', events);
      return <EventsClientPage events={[]} communities={communities || []} />;
    }

    // Format dates for display and serialize Date objects
    const formattedEvents = await Promise.all(events.map(async (event, index) => {
      try {
        console.log(`Processing event ${index}:`, event);
        
        // Ensure all required fields exist
        if (!event || !event.id || !event.startDate) {
          console.warn(`Skipping invalid event at index ${index}:`, event);
          return null;
        }

        return {
          ...event,
          startDate: event.startDate.toISOString(),
          endDate: event.endDate ? event.endDate.toISOString() : null,
          submittedAt: event.submittedAt.toISOString(),
          updatedAt: event.updatedAt.toISOString(),
          formattedStartDate: await formatDate(event.startDate.toISOString()),
          formattedEndDate: event.endDate ? await formatDate(event.endDate.toISOString()) : null,
        };
      } catch (error) {
        console.error(`Error processing event ${index}:`, error, event);
        return null;
      }
    }));

    // Filter out null events
    const validEvents = formattedEvents.filter(event => event !== null);
    console.log('Formatted events:', validEvents);
    console.log('Number of valid events:', validEvents.length);

    return <EventsClientPage events={validEvents} communities={communities || []} />;
  } catch (error) {
    console.error('Error loading events:', error);
    // Return empty array if there's an error
    return <EventsClientPage events={[]} communities={[]} />;
  }
} 