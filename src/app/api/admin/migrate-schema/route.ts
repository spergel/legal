import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { secret } = await request.json();

    // Validate secret to prevent unauthorized access
    if (!secret || secret !== process.env.SCRAPER_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting schema migration for categorization fields...');

    // Check if categorization columns already exist
    try {
      await prisma.event.findFirst({
        select: { category: true, tags: true, eventType: true },
        take: 1
      });
      
      return NextResponse.json({
        success: true,
        message: 'Categorization columns already exist',
        status: 'already_migrated'
      });
    } catch (error) {
      console.log('Categorization columns do not exist, proceeding with migration...');
    }

    // Run the migration using raw SQL
    const migrationSql = `
      -- Add categorization fields to Event table
      ALTER TABLE "Event" 
      ADD COLUMN IF NOT EXISTS "category" TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS "eventType" TEXT,
      ADD COLUMN IF NOT EXISTS "image" TEXT,
      ADD COLUMN IF NOT EXISTS "price" JSONB,
      ADD COLUMN IF NOT EXISTS "metadata" JSONB;
    `;

    await prisma.$executeRawUnsafe(migrationSql);

    console.log('✅ Schema migration completed successfully');

    // Verify the migration worked
    await prisma.event.findFirst({
      select: { category: true, tags: true, eventType: true },
      take: 1
    });

    // Count current events to show in response
    const eventCount = await prisma.event.count();

    return NextResponse.json({
      success: true,
      message: 'Schema migration completed successfully',
      status: 'migrated',
      details: {
        addedColumns: ['category', 'tags', 'eventType', 'image', 'price', 'metadata'],
        existingEvents: eventCount,
        nextSteps: [
          'Run scrapers to populate categorization data',
          'Check API endpoints for categorization fields',
          'Update Zapier/Squarespace integration if needed'
        ]
      }
    });

  } catch (error) {
    console.error('❌ Schema migration failed:', error);
    return NextResponse.json(
      { 
        error: 'Migration failed', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/admin/migrate-schema',
    description: 'Add categorization fields to Event table',
    method: 'POST',
    requiredField: 'secret (SCRAPER_SECRET)',
    addedColumns: ['category', 'tags', 'eventType', 'image', 'price', 'metadata']
  });
}
