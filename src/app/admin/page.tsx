import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import AdminDashboard from './AdminDashboard';
import { 
  getPendingEvents, 
  updateEventStatus,
  getAllEventsForAdmin 
} from '@/lib/data-loader';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

export default async function AdminPage({ searchParams }: any) {
  const session = await getServerSession(authOptions);
  if (!session || !ADMIN_EMAILS.includes(session.user?.email as string)) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-6 bg-[#f6ecd9] border border-[#c8b08a] rounded-lg text-center">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <p className="mb-4">You do not have access to this page.</p>
        <Link href="/" className="text-[#5b4636] underline">Back to Home</Link>
      </div>
    );
  }

  // Handle actions
  if (searchParams?.approve) {
    const pending = await getPendingEvents();
    const event = pending[Number(searchParams.approve)];
    if (event) {
      await updateEventStatus(event.id, 'APPROVED', session.user?.email as string, 'Approved via admin dashboard');
    }
  }
  
  if (searchParams?.deny) {
    const pending = await getPendingEvents();
    const event = pending[Number(searchParams.deny)];
    if (event) {
      await updateEventStatus(event.id, 'DENIED', session.user?.email as string, 'Denied via admin dashboard');
    }
  }
  
  if (searchParams?.updateStatus) {
    await updateEventStatus(
      searchParams.eventId, 
      searchParams.status, 
      session.user?.email as string,
      `Status updated to ${searchParams.status} via admin dashboard`
    );
  }

  // Get data from database
  const pending = await getPendingEvents();
  const allEvents = await getAllEventsForAdmin();
  const currentTab = searchParams.tab || 'pending';

  // Transform data to match expected format
  const transformedAllEvents = {
    events: allEvents.map((event: any) => ({
      ...event,
      status: event.status.toLowerCase(),
      photo: event.photo || null
    }))
  };

  const transformedPending = pending.map((event: any) => ({
    ...event,
    status: event.status.toLowerCase(),
    photo: event.photo || null
  }));

  return <AdminDashboard 
    pending={transformedPending} 
    allEvents={transformedAllEvents} 
    currentTab={currentTab}
    searchParams={searchParams}
  />;
} 