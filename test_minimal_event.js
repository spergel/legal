const { PrismaClient } = require('@prisma/client');

async function testMinimalEvent() {
  const prisma = new PrismaClient();

  try {
    console.log('Testing minimal event creation...');
    
    // Try to create the simplest possible event
    const result = await prisma.event.create({
      data: {
        id: 'test_minimal_' + Date.now(),
        name: 'Test Event',
        description: 'Simple test',
        startDate: new Date('2025-09-18T12:00:00Z'),
        endDate: new Date('2025-09-18T13:00:00Z'),
        locationName: 'Test Location',
        status: 'APPROVED',
        submittedBy: 'test',
        submittedAt: new Date(),
        updatedAt: new Date(),
        // All other fields as null or defaults - only use simple fields
        externalId: null,
        url: null,
        cleCredits: null,
        updatedBy: null,
        notes: null,
        eventType: null,
        image: null,
        price: null,
        metadata: null,
      }
    });
    
    console.log('✅ SUCCESS: Created minimal event:', result.id);
    return true;
    
  } catch (error) {
    console.error('❌ ERROR creating minimal event:', error.message);
    console.error('Full error:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testMinimalEvent();
