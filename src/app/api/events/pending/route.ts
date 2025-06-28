import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPendingEvents } from '@/lib/data-loader';

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

    const events = await getPendingEvents();
    
    // Transform data to match expected format
    const transformedEvents = events.map((event: any) => ({
      ...event,
      status: event.status.toLowerCase(),
      photo: event.photo || null
    }));

    return NextResponse.json(transformedEvents);
  } catch (error) {
    console.error('Error fetching pending events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending events' },
      { status: 500 }
    );
  }
} 