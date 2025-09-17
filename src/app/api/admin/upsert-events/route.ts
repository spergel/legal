import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// For security, require a secret token in the header
const SCRAPER_SECRET = process.env.SCRAPER_SECRET;

export async function POST(req: Request) {
  try {
    const { events, secret } = await req.json();
    if (!SCRAPER_SECRET || secret !== SCRAPER_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!Array.isArray(events)) {
      return NextResponse.json({ error: 'Invalid payload, events must be an array' }, { status: 400 });
    }

    const results = [];
    let createdCount = 0;
    let updatedCount = 0;

    for (const event of events) {
      const { scraper_name, ...eventData } = event; // Extract scraper_name
      
      // Convert arrays to comma-separated strings for SQLite
      if (eventData.category && Array.isArray(eventData.category)) {
        eventData.category = eventData.category.join(',');
      }
      if (eventData.tags && Array.isArray(eventData.tags)) {
        eventData.tags = eventData.tags.join(',');
      }
      if (eventData.price && typeof eventData.price === 'object') {
        eventData.price = JSON.stringify(eventData.price);
      }
      if (eventData.metadata && typeof eventData.metadata === 'object') {
        eventData.metadata = JSON.stringify(eventData.metadata);
      }
      
      try {
        // Check if event exists by externalId or name+startDate
        const existingEvent = await prisma.event.findFirst({
          where: eventData.externalId ? 
            { externalId: eventData.externalId } :
            {
              name: eventData.name,
              startDate: new Date(eventData.startDate)
            }
        });

        let result;
        if (existingEvent) {
          // Update existing event
          result = await prisma.event.update({
            where: { id: existingEvent.id },
            data: {
              ...eventData,
              updatedAt: new Date(),
            }
          });
          updatedCount++;
          results.push({ success: true, id: result.id, action: 'updated' });
        } else {
          // Create new event
          result = await prisma.event.create({
            data: {
              ...eventData,
              createdAt: new Date(),
              updatedAt: new Date(),
              status: 'APPROVED',
            }
          });
          createdCount++;
          results.push({ success: true, id: result.id, action: 'created' });
        }
      } catch (err) {
        results.push({ error: err instanceof Error ? err.message : String(err), event: eventData });
      }
    }
    return NextResponse.json({ 
      message: "Upsert complete",
      created: createdCount,
      updated: updatedCount,
      results 
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
} 