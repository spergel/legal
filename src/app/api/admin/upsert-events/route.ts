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
        // Use upsert with the composite unique constraint
        const upsertResult = await prisma.event.upsert({
          where: {
            unique_event_per_community: {
              name: eventData.name,
              startDate: new Date(eventData.startDate),
              communityId: eventData.communityId || null
            }
          },
          update: {
            ...eventData,
            updatedAt: new Date(),
            updatedBy: scraper_name || 'scraper',
          },
          create: {
            ...eventData,
            submittedBy: scraper_name || 'scraper',
            submittedAt: new Date(),
            status: 'APPROVED',
          },
        });
        
        // Check if this was an update or create by looking at submittedAt vs updatedAt
        const isUpdate = upsertResult.updatedAt.getTime() > upsertResult.submittedAt.getTime();
        if (isUpdate) {
          updatedCount++;
          results.push({ success: true, id: upsertResult.id, action: 'updated' });
        } else {
          createdCount++;
          results.push({ success: true, id: upsertResult.id, action: 'created' });
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