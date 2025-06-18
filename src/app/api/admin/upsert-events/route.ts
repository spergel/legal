import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// For security, require a secret token in the header
const SCRAPER_SECRET = process.env.SCRAPER_SECRET;

export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  if (!SCRAPER_SECRET || auth !== `Bearer ${SCRAPER_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { events } = await req.json();
    if (!Array.isArray(events)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const results = [];
    for (const event of events) {
      // Upsert by a unique field (e.g., externalId or url). Adjust as needed.
      if (!event.externalId && !event.url) {
        results.push({ error: 'Missing unique identifier', event });
        continue;
      }
      const where = event.externalId
        ? { externalId: event.externalId }
        : { url: event.url };
      try {
        const upserted = await prisma.event.upsert({
          where,
          update: {
            ...event,
            updatedAt: new Date(),
          },
          create: {
            ...event,
            submittedBy: 'scraper',
            submittedAt: new Date(),
            status: 'APPROVED', // or 'PENDING' if you want admin review
          },
        });
        results.push({ success: true, id: upserted.id });
      } catch (err) {
        results.push({ error: err instanceof Error ? err.message : String(err), event });
      }
    }
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
} 