import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking database for duplicates...');
    
    // Get all events
    const allEvents = await prisma.event.findMany({
      orderBy: {
        startDate: 'asc'
      }
    });
    
    console.log(`📊 Total events in database: ${allEvents.length}`);
    
    // Group events by name+startDate (same logic as our deduplication)
    const eventGroups = new Map();
    
    for (const event of allEvents) {
      const key = `${event.name}-${event.startDate.toISOString()}`;
      
      if (!eventGroups.has(key)) {
        eventGroups.set(key, []);
      }
      eventGroups.get(key)!.push(event);
    }
    
    // Find duplicates
    const duplicates = [];
    for (const [key, events] of eventGroups) {
      if (events.length > 1) {
        duplicates.push({ 
          key, 
          events: events.map(e => ({
            id: e.id,
            name: e.name,
            startDate: e.startDate,
            externalId: e.externalId,
            status: e.status,
            submittedAt: e.submittedAt
          }))
        });
      }
    }
    
    console.log(`🔍 Duplicate groups found: ${duplicates.length}`);
    
    // Also check by externalId
    const externalIdGroups = new Map();
    
    for (const event of allEvents) {
      if (event.externalId) {
        if (!externalIdGroups.has(event.externalId)) {
          externalIdGroups.set(event.externalId, []);
        }
        externalIdGroups.get(event.externalId)!.push(event);
      }
    }
    
    const externalIdDuplicates = [];
    for (const [externalId, events] of externalIdGroups) {
      if (events.length > 1) {
        externalIdDuplicates.push({ 
          externalId, 
          events: events.map(e => ({
            id: e.id,
            name: e.name,
            startDate: e.startDate,
            status: e.status
          }))
        });
      }
    }
    
    console.log(`🔍 Duplicate externalId groups: ${externalIdDuplicates.length}`);
    
    return NextResponse.json({
      success: true,
      stats: {
        totalEvents: allEvents.length,
        duplicateGroups: duplicates.length,
        externalIdDuplicateGroups: externalIdDuplicates.length
      },
      duplicates: duplicates.slice(0, 10), // Show first 10
      externalIdDuplicates: externalIdDuplicates.slice(0, 5), // Show first 5
      completedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error checking duplicates:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check duplicates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
