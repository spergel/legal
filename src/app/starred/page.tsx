import { getAllEvents, formatDate } from '@/lib/data-loader';
import EventsList from '../events/components/EventsList';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function StarredEventsPage() {
  const session = await getServerSession(authOptions);
  
  // Redirect to sign in if not authenticated
  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  const events = await getAllEvents();

  // Format dates for display
  const formattedEvents = await Promise.all(events.map(async event => ({
    ...event,
    formattedStartDate: await formatDate(event.startDate.toISOString()),
    formattedEndDate: event.endDate ? await formatDate(event.endDate.toISOString()) : null,
  })));

  return (
    <div className="container mx-auto px-4 py-8">
      <EventsList events={formattedEvents} showStarredOnly={true} />
    </div>
  );
} 