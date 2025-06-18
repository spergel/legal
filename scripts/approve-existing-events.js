#!/usr/bin/env node

/**
 * Script to approve all existing events in the database.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function approveAllEvents() {
  try {
    console.log('Approving all existing events...');
    
    const result = await prisma.event.updateMany({
      where: {
        status: 'PENDING'
      },
      data: {
        status: 'APPROVED',
        updatedAt: new Date(),
        updatedBy: 'system@auto-approve',
        notes: 'Auto-approved existing events'
      }
    });
    
    console.log(`Successfully approved ${result.count} events`);
    
    // Also check how many events we have total
    const totalEvents = await prisma.event.count();
    const approvedEvents = await prisma.event.count({
      where: { status: 'APPROVED' }
    });
    const featuredEvents = await prisma.event.count({
      where: { status: 'FEATURED' }
    });
    
    console.log(`\nEvent Summary:`);
    console.log(`Total events: ${totalEvents}`);
    console.log(`Approved events: ${approvedEvents}`);
    console.log(`Featured events: ${featuredEvents}`);
    
  } catch (error) {
    console.error('Error approving events:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  approveAllEvents();
} 