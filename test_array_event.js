const { PrismaClient } = require('@prisma/client');

async function testArrayEvent() {
  const prisma = new PrismaClient();

  try {
    console.log('Testing event creation with arrays...');
    
    const result = await prisma.event.create({
      data: {
        id: 'test_array_' + Date.now(),
        name: 'Test Event with Arrays',
        description: 'Testing categories and tags',
        startDate: new Date('2025-09-18T12:00:00Z'),
        endDate: new Date('2025-09-18T13:00:00Z'),
        locationName: 'Test Location',
        status: 'APPROVED',
        submittedBy: 'test',
        submittedAt: new Date(),
        updatedAt: new Date(),
        externalId: null,
        url: null,
        cleCredits: null,
        updatedBy: null,
        notes: null,
        eventType: null,
        image: null,
        price: null,
        metadata: null,
        // Test the array fields
        category: ['CLE', 'Networking'],
        tags: ['test', 'legal', 'event'],
      }
    });
    
    console.log('✅ SUCCESS: Created event with arrays:', result.id);
    console.log('Categories:', result.category);
    console.log('Tags:', result.tags);
    return true;
    
  } catch (error) {
    console.error('❌ ERROR creating event with arrays:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testArrayEvent();
