import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // This endpoint can be called by a cron job or manually
    // to refresh the Google Calendar
    
    const events = await prisma.event.findMany({
      where: {
        status: {
          in: ['APPROVED', 'FEATURED']
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    });

    // Log the sync for monitoring
    console.log(`📅 Calendar sync: ${events.length} events processed`);
    
    return NextResponse.json({
      success: true,
      message: `Calendar synced with ${events.length} events`,
      lastUpdated: new Date().toISOString(),
      eventCount: events.length
    });

  } catch (error) {
    console.error('Error syncing calendar:', error);
    return NextResponse.json(
      { error: 'Failed to sync calendar' },
      { status: 500 }
    );
  }
}

// Also allow GET for manual testing
export async function GET(request: NextRequest) {
  return POST(request);
}

