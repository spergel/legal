const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEvents() {
  try {
    const events = await prisma.event.findMany({
      where: {
        status: { in: ['APPROVED', 'FEATURED'] }
      },
      include: { location: true, community: true }
    });
    
    console.log('Checking', events.length, 'events for null/undefined values...');
    
    events.forEach((event, index) => {
      const issues = [];
      if (!event.id) issues.push('missing id');
      if (!event.name) issues.push('missing name');
      if (!event.startDate) issues.push('missing startDate');
      if (!event.description) issues.push('missing description');
      if (!event.locationName) issues.push('missing locationName');
      
      if (issues.length > 0) {
        console.log(`Event ${index} (${event.id}): ${issues.join(', ')}`);
      }
    });
    
    console.log('Check complete');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEvents(); 