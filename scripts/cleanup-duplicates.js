const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupDuplicates() {
  console.log('🔍 Starting duplicate cleanup...');
  
  try {
    // Get all events
    const allEvents = await prisma.event.findMany({
      orderBy: {
        createdAt: 'asc' // Keep the oldest version
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
      eventGroups.get(key).push(event);
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
    
    // Process each duplicate group
    for (const { key, events } of duplicates) {
      // Sort by createdAt (keep the oldest)
      events.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      const keepEvent = events[0];
      const removeEvents = events.slice(1);
      
      console.log(`\n📝 Processing: "${keepEvent.name}"`);
      console.log(`   Keeping: ${keepEvent.id} (created: ${keepEvent.createdAt})`);
      console.log(`   Removing: ${removeEvents.length} duplicates`);
      
      // Remove duplicates
      for (const eventToRemove of removeEvents) {
        try {
          await prisma.event.delete({
            where: { id: eventToRemove.id }
          });
          totalRemoved++;
          console.log(`   ✅ Removed: ${eventToRemove.id}`);
        } catch (error) {
          console.log(`   ❌ Failed to remove ${eventToRemove.id}: ${error.message}`);
        }
      }
    }
    
    console.log(`\n🎉 Cleanup completed!`);
    console.log(`📊 Total events removed: ${totalRemoved}`);
    console.log(`📊 Remaining events: ${allEvents.length - totalRemoved}`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupDuplicates();
