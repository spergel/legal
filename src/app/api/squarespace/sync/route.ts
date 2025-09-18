import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// This endpoint will sync events TO Squarespace's native Events system
// You'll need to configure Squarespace API credentials in your environment

export async function POST(request: NextRequest) {
  try {
    const { squarespaceApiKey, squareSiteId, secret } = await request.json();

    // Validate secret to prevent unauthorized access
    if (!secret || secret !== process.env.SQUARESPACE_SYNC_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get recent events from your database
    const recentEvents = await prisma.event.findMany({
      where: {
        status: 'APPROVED',
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Events updated in last 24 hours
        }
      },
      orderBy: {
        startDate: 'asc'
      },
      take: 50 // Limit to prevent overwhelming Squarespace
    });

    const results = {
      synced: 0,
      errors: [] as string[]
    };

    // Sync each event to Squarespace
    for (const event of recentEvents) {
      try {
        // Format event for Squarespace's Events API
        const squarespaceEvent = {
          title: event.name,
          description: event.description,
          startDate: event.startDate.toISOString(),
          endDate: event.endDate.toISOString(),
          location: event.locationText,
          // Map your fields to Squarespace's event schema
          customFields: {
            community: event.communityText,
            hasCLE: event.hasCLE,
            cleCredits: event.cleCredits,
            externalUrl: event.url,
            externalId: event.externalId
          }
        };

        // Call Squarespace API to create/update event
        const squarespaceResponse = await fetch(
          `https://api.squarespace.com/1.0/commerce/inventory/${squareSiteId}/events`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${squarespaceApiKey}`,
              'Content-Type': 'application/json',
              'User-Agent': 'LegalEventsCalendar/1.0'
            },
            body: JSON.stringify(squarespaceEvent)
          }
        );

        if (squarespaceResponse.ok) {
          results.synced++;
        } else {
          const errorText = await squarespaceResponse.text();
          results.errors.push(`Failed to sync event "${event.name}": ${errorText}`);
        }

      } catch (error) {
        results.errors.push(`Error processing event "${event.name}": ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${results.synced} events to Squarespace`,
      results
    });

  } catch (error) {
    console.error('Error syncing to Squarespace:', error);
    return NextResponse.json(
      { error: 'Failed to sync events to Squarespace' },
      { status: 500 }
    );
  }
}

// GET endpoint to provide webhook URL for Zapier
export async function GET() {
  return NextResponse.json({
    webhookUrl: 'https://legal.somethingtodo.nyc/api/squarespace/sync',
    description: 'Use this endpoint in Zapier to sync events to Squarespace',
    method: 'POST',
    requiredFields: {
      squarespaceApiKey: 'Your Squarespace API key',
      squareSiteId: 'Your Squarespace site ID',
      secret: 'Sync secret (set in environment)'
    }
  });
}
