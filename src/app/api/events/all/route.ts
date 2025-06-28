import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAllEventsForAdmin } from '@/lib/data-loader';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !ADMIN_EMAILS.includes(session.user?.email as string)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const allEvents = await getAllEventsForAdmin();
    
    // Transform data to match expected format
    const transformedAllEvents = {
      events: allEvents.map((event: any) => ({
        ...event,
        status: event.status.toLowerCase(),
        photo: event.photo || null
      }))
    };

    return NextResponse.json(transformedAllEvents);
  } catch (error) {
    console.error('Error fetching all events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
} 