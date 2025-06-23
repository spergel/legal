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
      if (!eventData.externalId && !eventData.url) {
        results.push({ error: 'Missing unique identifier', event: eventData });
        continue;
      }
      
      const where = eventData.externalId
        ? { externalId: eventData.externalId }
        : { url: eventData.url };
        
      try {
        const existing = await prisma.event.findFirst({ where });
        if (existing) {
          // Update existing event
          await prisma.event.update({
            where: { id: existing.id },
            data: {
              ...eventData,
              updatedAt: new Date(),
              updatedBy: scraper_name || 'scraper', // Use scraper_name
            },
          });
          updatedCount++;
          results.push({ success: true, id: existing.id, action: 'updated' });
        } else {
          // Create new event
          const newEvent = await prisma.event.create({
            data: {
              ...eventData,
              submittedBy: scraper_name || 'scraper', // Use scraper_name
              submittedAt: new Date(),
              status: 'APPROVED', 
            },
          });
          createdCount++;
          results.push({ success: true, id: newEvent.id, action: 'created' });
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