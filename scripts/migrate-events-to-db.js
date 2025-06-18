#!/usr/bin/env node

/**
 * Script to migrate events from JSON files to the database.
 * This script reads events from public/data/all_events_combined.json and inserts them into the database.
 */

const fs = require('fs').promises;
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class EventMigrator {
  constructor() {
    this.dataFile = path.join(__dirname, '..', 'public', 'data', 'all_events_combined.json');
  }

  async loadEventsFromJson() {
    try {
      const fileContent = await fs.readFile(this.dataFile, 'utf8');
      const data = JSON.parse(fileContent);
      return data.events || [];
    } catch (error) {
      console.error(`Error reading ${this.dataFile}:`, error.message);
      return [];
    }
  }

  async createOrGetCommunity(communityName) {
    if (!communityName) return null;

    // Try to find existing community
    let existing = await prisma.community.findFirst({
      where: { name: communityName }
    });

    if (existing) {
      return existing.id;
    }

    // Create new community
    const newCommunity = await prisma.community.create({
      data: {
        name: communityName,
        description: `Community for ${communityName}`
      }
    });

    return newCommunity.id;
  }

  async createOrGetLocation(locationData) {
    if (!locationData || !locationData.address) return null;

    const address = locationData.address;

    // Try to find existing location
    let existing = await prisma.location.findFirst({
      where: { address: address }
    });

    if (existing) {
      return existing.id;
    }

    // Create new location
    const newLocation = await prisma.location.create({
      data: {
        name: locationData.name || 'Unknown Location',
        address: address,
        city: locationData.city || '',
        state: locationData.state || '',
        zip: locationData.zip || ''
      }
    });

    return newLocation.id;
  }

  async migrateEvent(eventData) {
    try {
      // Check if event already exists by externalId or name + startDate
      let existingEvent = null;
      
      if (eventData.externalId) {
        existingEvent = await prisma.event.findUnique({
          where: { externalId: eventData.externalId }
        });
      }

      if (!existingEvent) {
        // Try to find by name and start date
        const startDate = new Date(eventData.startDate);
        if (isNaN(startDate.getTime())) {
          console.log(`Skipping event with invalid date: ${eventData.name}`);
          return false;
        }
        
        existingEvent = await prisma.event.findFirst({
          where: {
            name: eventData.name,
            startDate: startDate
          }
        });
      }

      if (existingEvent) {
        console.log(`Event already exists: ${eventData.name}`);
        return true;
      }

      // Create or get community
      let communityId = null;
      if (eventData.community) {
        communityId = await this.createOrGetCommunity(eventData.community);
      }

      // Create or get location
      let locationId = null;
      if (eventData.location) {
        locationId = await this.createOrGetLocation(eventData.location);
      }

      // Parse dates
      const startDate = new Date(eventData.startDate);
      const endDate = eventData.endDate ? new Date(eventData.endDate) : startDate;

      // Create the event - AUTO APPROVE scraped events
      const newEvent = await prisma.event.create({
        data: {
          externalId: eventData.externalId,
          name: eventData.name,
          description: eventData.description || '',
          startDate: startDate,
          endDate: endDate,
          locationName: eventData.locationName || '',
          url: eventData.url,
          cleCredits: eventData.cleCredits,
          status: 'APPROVED', // Auto-approve scraped events
          submittedBy: eventData.submittedBy || 'system@migration',
          submittedAt: new Date(),
          updatedAt: new Date(),
          updatedBy: 'system@migration',
          notes: `Auto-approved scraped event migrated from JSON file on ${new Date().toISOString()}`,
          locationId: locationId,
          communityId: communityId
        }
      });

      console.log(`Created and approved event: ${eventData.name} (ID: ${newEvent.id})`);
      return true;

    } catch (error) {
      console.error(`Error migrating event ${eventData.name || 'Unknown'}:`, error.message);
      return false;
    }
  }

  async migrateAllEvents() {
    console.log('Loading events from JSON file...');
    const events = await this.loadEventsFromJson();

    if (!events.length) {
      console.log('No events found in JSON file!');
      return;
    }

    console.log(`Found ${events.length} events to migrate`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      console.log(`Processing event ${i + 1}/${events.length}: ${event.name || 'Unknown'}`);

      if (await this.migrateEvent(event)) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    console.log('\nMigration complete!');
    console.log(`Successfully migrated and approved: ${successCount} events`);
    console.log(`Errors: ${errorCount} events`);
  }
}

async function main() {
  const migrator = new EventMigrator();

  try {
    console.log('Starting migration...');
    await migrator.migrateAllEvents();
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
} 