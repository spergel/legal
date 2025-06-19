const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Get all events
    const events = await prisma.event.findMany({
      where: {
        status: {
          in: ['APPROVED', 'FEATURED']
        }
      },
      orderBy: {
        startDate: 'asc'
      },
      include: {
        location: true,
        community: true
      }
    });
    
    console.log('Total events found:', events.length);
    
    if (events.length > 0) {
      console.log('First event structure:');
      console.log(JSON.stringify(events[0], null, 2));
      
      // Check for any events with null/undefined values
      events.forEach((event, index) => {
        if (!event.id || !event.name || !event.startDate) {
          console.warn(`Event ${index} has missing required fields:`, {
            id: event.id,
            name: event.name,
            startDate: event.startDate
          });
        }
      });
    } else {
      console.log('No events found in database');
    }
    
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase(); 