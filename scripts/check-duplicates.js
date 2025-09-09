const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDuplicates() {
  console.log('🔍 Checking database for duplicates...');
  
  try {
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
      eventGroups.get(key).push(event);
    }
    
    // Find duplicates
    const duplicates = [];
    for (const [key, events] of eventGroups) {
      if (events.length > 1) {
        duplicates.push({ key, events });
      }
    }
    
    console.log(`🔍 Duplicate groups found: ${duplicates.length}`);
    
    if (duplicates.length > 0) {
      console.log('\n📝 Duplicate events:');
      for (const { key, events } of duplicates.slice(0, 10)) { // Show first 10
        console.log(`\n"${events[0].name}" (${events[0].startDate.toISOString()})`);
        console.log(`  Count: ${events.length}`);
        console.log(`  IDs: ${events.map(e => e.id).join(', ')}`);
        console.log(`  External IDs: ${events.map(e => e.externalId || 'null').join(', ')}`);
        console.log(`  Status: ${events.map(e => e.status).join(', ')}`);
      }
      
      if (duplicates.length > 10) {
        console.log(`\n... and ${duplicates.length - 10} more duplicate groups`);
      }
    } else {
      console.log('✅ No duplicates found in database!');
    }
    
    // Also check by externalId
    console.log('\n🔍 Checking by externalId...');
    const externalIdGroups = new Map();
    
    for (const event of allEvents) {
      if (event.externalId) {
        if (!externalIdGroups.has(event.externalId)) {
          externalIdGroups.set(event.externalId, []);
        }
        externalIdGroups.get(event.externalId).push(event);
      }
    }
    
    const externalIdDuplicates = [];
    for (const [externalId, events] of externalIdGroups) {
      if (events.length > 1) {
        externalIdDuplicates.push({ externalId, events });
      }
    }
    
    console.log(`🔍 Duplicate externalId groups: ${externalIdDuplicates.length}`);
    
    if (externalIdDuplicates.length > 0) {
      console.log('\n📝 Duplicate externalId events:');
      for (const { externalId, events } of externalIdDuplicates.slice(0, 5)) {
        console.log(`\nExternal ID: ${externalId}`);
        console.log(`  Count: ${events.length}`);
        console.log(`  Names: ${events.map(e => e.name).join(' | ')}`);
        console.log(`  IDs: ${events.map(e => e.id).join(', ')}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking duplicates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkDuplicates();
