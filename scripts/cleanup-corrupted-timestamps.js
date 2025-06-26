#!/usr/bin/env node

/**
 * Cleanup script for corrupted timestamp events
 * Specifically targets AABANY events with the problematic 2025-07-22 16:14:24 timestamp
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupCorruptedTimestamps() {
  console.log('🔍 Searching for events with corrupted timestamps...');
  console.log(`🔗 Database URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);
  
  try {
    // First, let's see how many total events we have
    const totalEvents = await prisma.event.count();
    console.log(`📊 Total events in database: ${totalEvents}`);
    
    // Check for AABANY events
    const aabanyEvents = await prisma.event.count({
      where: {
        OR: [
          { name: { contains: 'AABANY', mode: 'insensitive' } },
          { description: { contains: 'AABANY', mode: 'insensitive' } },
          { submittedBy: { contains: 'aabany', mode: 'insensitive' } }
        ]
      }
    });
    console.log(`📊 AABANY events found: ${aabanyEvents}`);
    
    // Target the specific problematic timestamp range
    const corruptedDate = new Date('2025-07-22T16:14:23.000Z');
    const corruptedDateEnd = new Date('2025-07-22T16:14:25.000Z');
    
    // Find events with the corrupted timestamp (broader search)
    const corruptedEvents = await prisma.event.findMany({
      where: {
        startDate: {
          gte: corruptedDate,
          lte: corruptedDateEnd
        }
      },
      include: {
        community: true
      }
    });
    
    console.log(`📊 Found ${corruptedEvents.length} events with corrupted timestamps`);
    
    if (corruptedEvents.length === 0) {
      console.log('✅ No corrupted events found!');
      return;
    }
    
    // Display the events that will be deleted
    console.log('\n🗑️  Events to be deleted:');
    corruptedEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.name}`);
      console.log(`   Date: ${event.startDate.toISOString()}`);
      console.log(`   Community: ${event.community?.name || 'Unknown'}`);
      console.log(`   ID: ${event.id}`);
      console.log('');
    });
    
    // Delete the corrupted events
    const deleteResult = await prisma.event.deleteMany({
      where: {
        startDate: {
          gte: corruptedDate,
          lte: corruptedDateEnd
        }
      }
    });
    
    console.log(`✅ Successfully deleted ${deleteResult.count} corrupted events`);
    
    // Verify cleanup
    const remainingCorrupted = await prisma.event.count({
      where: {
        startDate: {
          gte: corruptedDate,
          lte: corruptedDateEnd
        }
      }
    });
    
    console.log(`🔍 Verification: ${remainingCorrupted} corrupted events remaining`);
    
    if (remainingCorrupted === 0) {
      console.log('🎉 Cleanup successful! All corrupted timestamps removed.');
    } else {
      console.log('⚠️  Some corrupted events may still remain. Manual review needed.');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting corrupted timestamp cleanup...');
    await cleanupCorruptedTimestamps();
  } catch (error) {
    console.error('💥 Cleanup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
} 