import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Check for admin authentication
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.SCRAPER_SECRET;
    
    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔍 Starting duplicate cleanup...');
    
    // Get all events
    const allEvents = await prisma.event.findMany({
      orderBy: {
        submittedAt: 'asc' // Keep the oldest version
      }
    });
    
    console.log(`📊 Found ${allEvents.length} total events`);
    
    // Group events by externalId or name+startDate
    const eventGroups = new Map();
    
    for (const event of allEvents) {
      const key = event.externalId || `${event.name}-${event.startDate.toISOString()}`;
      
      if (!eventGroups.has(key)) {
        eventGroups.set(key, []);
      }
      eventGroups.get(key)!.push(event);
    }
    
    // Find duplicates
    const duplicates = [];
    for (const [key, events] of eventGroups) {
      if (events.length > 1) {
        duplicates.push({ key, events });
      }
    }
    
    console.log(`🔍 Found ${duplicates.length} groups with duplicates`);
    
    let totalRemoved = 0;
    const removedEvents = [];
    
    // Process each duplicate group
    for (const { key, events } of duplicates) {
      // Sort by submittedAt (keep the oldest)
      events.sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
      
      const keepEvent = events[0];
      const removeEvents = events.slice(1);
      
      console.log(`\n📝 Processing: "${keepEvent.name}"`);
      console.log(`   Keeping: ${keepEvent.id} (submitted: ${keepEvent.submittedAt})`);
      console.log(`   Removing: ${removeEvents.length} duplicates`);
      
      // Remove duplicates
      for (const eventToRemove of removeEvents) {
        try {
          await prisma.event.delete({
            where: { id: eventToRemove.id }
          });
          totalRemoved++;
          removedEvents.push({
            id: eventToRemove.id,
            name: eventToRemove.name,
            submittedAt: eventToRemove.submittedAt
          });
          console.log(`   ✅ Removed: ${eventToRemove.id}`);
        } catch (error) {
          console.log(`   ❌ Failed to remove ${eventToRemove.id}: ${error}`);
        }
      }
    }
    
    console.log(`\n🎉 Cleanup completed!`);
    console.log(`📊 Total events removed: ${totalRemoved}`);
    console.log(`📊 Remaining events: ${allEvents.length - totalRemoved}`);
    
    return NextResponse.json({
      success: true,
      message: `Cleanup completed successfully`,
      stats: {
        totalEvents: allEvents.length,
        duplicateGroups: duplicates.length,
        eventsRemoved: totalRemoved,
        remainingEvents: allEvents.length - totalRemoved
      },
      removedEvents: removedEvents.slice(0, 10), // Show first 10 removed events
      completedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    return NextResponse.json(
      { 
        error: 'Failed to cleanup duplicates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Also allow GET for manual testing (with auth)
export async function GET(request: NextRequest) {
  return POST(request);
}
