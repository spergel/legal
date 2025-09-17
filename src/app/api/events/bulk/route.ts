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

        // Sanitize and validate data to prevent PostgreSQL errors
        const sanitizeString = (value: any): string | null => {
          if (value === null || value === undefined) return null;
          if (typeof value === 'string') return value.slice(0, 10000); // Limit length
          if (typeof value === 'object') return JSON.stringify(value).slice(0, 10000);
          return String(value).slice(0, 10000);
        };

        const sanitizeJsonString = (value: any): string | null => {
          if (value === null || value === undefined) return null;
          try {
            if (typeof value === 'string') {
              // Try to parse and re-stringify to ensure valid JSON
              JSON.parse(value);
              return value.slice(0, 10000);
            }
            return JSON.stringify(value).slice(0, 10000);
          } catch {
            return null;
          }
        };

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
              externalId: sanitizeString(eventData.externalId) || existingEvent.externalId,
              description: sanitizeString(eventData.description) || '',
              endDate: endDate,
              locationName: sanitizeString(eventData.locationName) || 'TBD',
              url: sanitizeString(eventData.url),
              cleCredits: eventData.cleCredits,
              updatedAt: now,
              updatedBy: sanitizeString(scraper) || 'scraper',
              notes: sanitizeString(eventData.notes),
              // Temporarily disable arrays to isolate the issue
              category: [],
              tags: [],
              eventType: sanitizeString(eventData.eventType),
              image: sanitizeString(eventData.image),
              price: null, // Temporarily disable complex JSON fields
              metadata: null // Temporarily disable complex JSON fields
            }
          });
          results.updated++;
        } else {
          // Create new event
          await prisma.event.create({
            data: {
              id: eventId,
              externalId: sanitizeString(eventData.externalId),
              name: sanitizeString(eventData.name) || 'Untitled Event',
              description: sanitizeString(eventData.description) || '',
              startDate: startDate,
              endDate: endDate,
              locationName: sanitizeString(eventData.locationName) || 'TBD',
              url: sanitizeString(eventData.url),
              cleCredits: eventData.cleCredits,
              status: 'APPROVED',
              submittedBy: sanitizeString(scraper) || 'scraper',
              submittedAt: now,
              updatedAt: now,
              updatedBy: sanitizeString(scraper) || 'scraper',
              notes: sanitizeString(eventData.notes),
              // Temporarily disable arrays to isolate the issue
              category: [],
              tags: [],
              eventType: sanitizeString(eventData.eventType),
              image: sanitizeString(eventData.image),
              price: null, // Temporarily disable complex JSON fields
              metadata: null // Temporarily disable complex JSON fields
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
