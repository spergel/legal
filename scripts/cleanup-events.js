#!/usr/bin/env node

/**
 * Event Cleanup Script
 * 
 * This script can be run as a cron job to automatically clean up old events.
 * 
 * Usage:
 * - Manual: node scripts/cleanup-events.js
 * - Cron: 0 2 * * * cd /path/to/legal && node scripts/cleanup-events.js
 * 
 * The script will:
 * - Delete events that ended more than 1 day ago
 * - Delete cancelled events that were cancelled more than 1 day ago
 * - Archive denied events that are more than 1 week old
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupOldEvents() {
  const errors = [];
  let deleted = 0;
  let archived = 0;
  
  console.log('🔄 Starting event cleanup...');
  console.log(`📅 Current time: ${new Date().toISOString()}`);
  
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Delete events that ended more than a day ago
    const pastEventsResult = await prisma.event.deleteMany({
      where: {
        endDate: {
          lt: oneDayAgo
        },
        status: {
          in: ['APPROVED', 'FEATURED', 'PENDING']
        }
      }
    });
    
    deleted += pastEventsResult.count;
    console.log(`✅ Deleted ${pastEventsResult.count} past events`);
    
    // Delete cancelled events that were cancelled more than a day ago
    const cancelledEventsResult = await prisma.event.deleteMany({
      where: {
        status: 'CANCELLED',
        updatedAt: {
          lt: oneDayAgo
        }
      }
    });
    
    deleted += cancelledEventsResult.count;
    console.log(`✅ Deleted ${cancelledEventsResult.count} old cancelled events`);
    
    // Archive denied events that are more than a week old
    const deniedEventsResult = await prisma.event.updateMany({
      where: {
        status: 'DENIED',
        updatedAt: {
          lt: oneWeekAgo
        }
      },
      data: {
        status: 'ARCHIVED',
        updatedAt: new Date(),
        updatedBy: 'system@cleanup-cron',
        notes: 'Auto-archived old denied event via cleanup script'
      }
    });
    
    archived += deniedEventsResult.count;
    console.log(`📦 Archived ${deniedEventsResult.count} old denied events`);
    
    // Get cleanup statistics
    const stats = await getCleanupStats();
    console.log('\n📊 Current cleanup statistics:');
    console.log(`   Past events: ${stats.pastEvents}`);
    console.log(`   Old cancelled events: ${stats.oldCancelledEvents}`);
    console.log(`   Old denied events: ${stats.oldDeniedEvents}`);
    
    console.log(`\n🎉 Cleanup completed successfully!`);
    console.log(`   Deleted: ${deleted} events`);
    console.log(`   Archived: ${archived} events`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    errors.push(`Cleanup failed: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
  
  if (errors.length > 0) {
    console.error('❌ Errors occurred:', errors);
    process.exit(1);
  }
  
  console.log('✅ Cleanup script finished successfully');
}

async function getCleanupStats() {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const [pastEvents, oldCancelledEvents, oldDeniedEvents] = await Promise.all([
      prisma.event.count({
        where: {
          endDate: {
            lt: oneDayAgo
          },
          status: {
            in: ['APPROVED', 'FEATURED', 'PENDING']
          }
        }
      }),
      prisma.event.count({
        where: {
          status: 'CANCELLED',
          updatedAt: {
            lt: oneDayAgo
          }
        }
      }),
      prisma.event.count({
        where: {
          status: 'DENIED',
          updatedAt: {
            lt: oneWeekAgo
          }
        }
      })
    ]);
    
    return {
      pastEvents,
      oldCancelledEvents,
      oldDeniedEvents
    };
  } catch (error) {
    console.error('Error getting cleanup stats:', error);
    return {
      pastEvents: 0,
      oldCancelledEvents: 0,
      oldDeniedEvents: 0
    };
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupOldEvents()
    .then(() => {
      console.log('🏁 Script execution completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script execution failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupOldEvents, getCleanupStats }; 