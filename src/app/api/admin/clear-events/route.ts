import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// For security, require a secret token
const SCRAPER_SECRET = process.env.SCRAPER_SECRET;

export async function POST(req: Request) {
  try {
    const { secret } = await req.json();

    if (!SCRAPER_SECRET || secret !== SCRAPER_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🗑️ Clearing all events from database...');

    // Count events before deletion
    const eventCount = await prisma.event.count();
    console.log(`📊 Found ${eventCount} events to delete`);

    // Delete all events
    const deleteResult = await prisma.event.deleteMany({});

    console.log(`✅ Deleted ${deleteResult.count} events`);

    return NextResponse.json({
      success: true,
      message: `Cleared ${deleteResult.count} events from database`,
      deletedCount: deleteResult.count
    });

  } catch (error) {
    console.error('❌ Error clearing events:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
