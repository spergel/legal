import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// For security, require a secret token for scraper access
const SCRAPER_SECRET = process.env.SCRAPER_SECRET;

export async function POST(req: Request) {
  try {
    const { events, scraper, secret } = await req.json();

    // Verify scraper secret
    if (!SCRAPER_SECRET || secret !== SCRAPER_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!events || !Array.isArray(events)) {
      return NextResponse.json({ error: 'Events array is required' }, { status: 400 });
    }

    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[]
    };

    for (const eventData of events) {
      try {
        // Validate required fields
        if (!eventData.name || !eventData.startDate) {
          results.errors.push(`Event missing required fields: ${JSON.stringify(eventData)}`);
          continue;
        }

        // Parse dates
        const startDate = new Date(eventData.startDate);
        const endDate = eventData.endDate ? new Date(eventData.endDate) : startDate;

        if (isNaN(startDate.getTime())) {
          results.errors.push(`Invalid start date for event: ${eventData.name}`);
          continue;
        }

        // Generate event ID
        const eventId = eventData.externalId || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Check if event exists (by externalId or by name/startDate/communityId)
        let existingEvent = null;

        if (eventData.externalId) {
          existingEvent = await prisma.event.findUnique({
            where: { externalId: eventData.externalId }
          });
        }

        if (!existingEvent) {
          existingEvent = await prisma.event.findFirst({
            where: {
              name: eventData.name,
              startDate: startDate,
              communityId: eventData.communityId
            }
          });
        }

        const now = new Date();

        if (existingEvent) {
          // Update existing event
          await prisma.event.update({
            where: { id: existingEvent.id },
            data: {
              externalId: eventData.externalId || existingEvent.externalId,
              description: eventData.description || '',
              endDate: endDate,
              locationName: eventData.locationName || 'TBD',
              url: eventData.url,
              cleCredits: eventData.cleCredits,
              updatedAt: now,
              updatedBy: scraper || 'scraper',
              notes: eventData.notes,
              locationId: eventData.locationId,
              communityId: eventData.communityId,
              category: eventData.category ? (Array.isArray(eventData.category) ? eventData.category.join(',') : eventData.category) : null,
              tags: eventData.tags ? (Array.isArray(eventData.tags) ? eventData.tags.join(',') : eventData.tags) : null,
              eventType: eventData.eventType,
              image: eventData.image,
              price: eventData.price ? JSON.stringify(eventData.price) : null,
              metadata: eventData.metadata ? JSON.stringify(eventData.metadata) : null
            }
          });
          results.updated++;
        } else {
          // Create new event
          await prisma.event.create({
            data: {
              id: eventId,
              externalId: eventData.externalId,
              name: eventData.name,
              description: eventData.description || '',
              startDate: startDate,
              endDate: endDate,
              locationName: eventData.locationName || 'TBD',
              url: eventData.url,
              cleCredits: eventData.cleCredits,
              status: 'APPROVED',
              submittedBy: scraper || 'scraper',
              submittedAt: now,
              updatedAt: now,
              updatedBy: scraper || 'scraper',
              notes: eventData.notes,
              locationId: eventData.locationId,
              communityId: eventData.communityId,
              category: eventData.category ? (Array.isArray(eventData.category) ? eventData.category.join(',') : eventData.category) : null,
              tags: eventData.tags ? (Array.isArray(eventData.tags) ? eventData.tags.join(',') : eventData.tags) : null,
              eventType: eventData.eventType,
              image: eventData.image,
              price: eventData.price ? JSON.stringify(eventData.price) : null,
              metadata: eventData.metadata ? JSON.stringify(eventData.metadata) : null
            }
          });
          results.created++;
        }

      } catch (eventError) {
        const errorMessage = eventError instanceof Error ? eventError.message : String(eventError);
        results.errors.push(`Error processing event ${eventData.name}: ${errorMessage}`);
        console.error('Error processing event:', eventData, eventError);
      }
    }

    return NextResponse.json({
      message: 'Bulk events processed successfully',
      ...results
    });

  } catch (error) {
    console.error('Error in bulk events API:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
