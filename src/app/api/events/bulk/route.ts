import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Test database connection first
    await prisma.$connect();
    
    const { events, scraper, secret } = await request.json();

    // Validate secret
    if (!secret || secret !== process.env.SCRAPER_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!events || !Array.isArray(events)) {
      return NextResponse.json({ error: 'Invalid events data' }, { status: 400 });
    }

    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[]
    };

    // Sanitize string data to prevent PostgreSQL protocol errors
    const sanitizeString = (value: any): string => {
      if (value === null || value === undefined) return '';
      let str = String(value);
      // Remove null characters and other problematic characters
      str = str.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      return str.slice(0, 1000); // Reasonable length limit
    };

    // Process events one by one with delays to avoid overwhelming serverless functions
    for (let i = 0; i < events.length; i++) {
      const eventData = events[i];
      
      try {
        // Validate required fields
        if (!eventData.name || !eventData.startDate) {
          results.errors.push(`Event missing required fields: ${eventData.name || 'Unknown'}`);
          continue;
        }

        // Parse and validate dates
        const startDate = new Date(eventData.startDate);
        const endDate = eventData.endDate ? new Date(eventData.endDate) : startDate;

        if (isNaN(startDate.getTime())) {
          results.errors.push(`Invalid start date for event: ${eventData.name}`);
          continue;
        }

        // Check if event exists by externalId or name+date
        let existingEvent = null;
        
        if (eventData.externalId) {
          existingEvent = await prisma.event.findUnique({
            where: { externalId: sanitizeString(eventData.externalId) }
          });
        }

        if (!existingEvent) {
          existingEvent = await prisma.event.findFirst({
            where: {
              name: sanitizeString(eventData.name),
              startDate: startDate
            }
          });
        }

        // Helper function for safe array handling
        const sanitizeArray = (value: any): string[] => {
          if (Array.isArray(value)) {
            return value.filter(item => item && typeof item === 'string').map(item => sanitizeString(item)).filter(Boolean);
          }
          if (typeof value === 'string' && value.trim()) {
            return [sanitizeString(value)];
          }
          return [];
        };

        // Helper function for safe JSON handling
        const sanitizeJson = (value: any): any => {
          if (value === null || value === undefined) return null;
          if (typeof value === 'object') return value;
          return null;
        };

        // Base event data (always present fields)
        let cleanEventData: any = {
          externalId: sanitizeString(eventData.externalId) || null,
          name: sanitizeString(eventData.name),
          description: sanitizeString(eventData.description),
          startDate: startDate,
          endDate: endDate,
          locationText: sanitizeString(eventData.locationText || eventData.locationName || eventData.location) || 'TBD',
          communityText: sanitizeString(eventData.communityText || eventData.communityName || scraper) || 'Unknown',
          url: sanitizeString(eventData.url) || null,
          hasCLE: Boolean(eventData.hasCLE || (eventData.cleCredits && eventData.cleCredits > 0)),
          cleCredits: typeof eventData.cleCredits === 'number' ? eventData.cleCredits : null,
          status: 'APPROVED',
          updatedAt: new Date()
        };

        // Add categorization fields if they exist in the database schema
        // This allows gradual migration without breaking existing functionality
        try {
          // Test if categorization columns exist by attempting a small query
          await prisma.event.findFirst({
            select: { category: true, tags: true, eventType: true },
            take: 1
          });
          
          // If successful, add categorization fields
          cleanEventData = {
            ...cleanEventData,
            category: sanitizeArray(eventData.category),
            tags: sanitizeArray(eventData.tags),
            eventType: sanitizeString(eventData.eventType) || null,
            image: sanitizeString(eventData.image) || null,
            price: sanitizeJson(eventData.price),
            metadata: sanitizeJson(eventData.metadata)
          };
        } catch (error) {
          // Categorization columns don't exist yet, skip them
          console.log('Categorization columns not yet available, using basic schema');
        }

        if (existingEvent) {
          // Update existing event
          await prisma.event.update({
            where: { id: existingEvent.id },
            data: cleanEventData
          });
          results.updated++;
        } else {
          // Create new event
          await prisma.event.create({
            data: {
              ...cleanEventData,
              createdAt: new Date()
            }
          });
          results.created++;
        }

      } catch (error) {
        console.error(`Error processing event ${eventData.name}:`, error);
        results.errors.push(`Error processing event ${eventData.name}: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Add small delay every 5 events to prevent connection issues
      if (i > 0 && i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${events.length} events`,
      ...results
    });

  } catch (error) {
    console.error('Error in bulk events API:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  } finally {
    try {
      await prisma.$disconnect();
    } catch (error) {
      console.error('Error disconnecting from database:', error);
    }
  }
}