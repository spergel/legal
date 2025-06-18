#!/usr/bin/env node

/**
 * Script to migrate communities from JSON files to the database.
 * This script reads communities from public/data/communities.json and inserts them into the database.
 */

const fs = require('fs').promises;
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class CommunityMigrator {
  constructor() {
    this.dataFile = path.join(__dirname, '..', 'public', 'data', 'communities.json');
  }

  async loadCommunitiesFromJson() {
    try {
      const fileContent = await fs.readFile(this.dataFile, 'utf8');
      const data = JSON.parse(fileContent);
      return data.communities || [];
    } catch (error) {
      console.error(`Error reading ${this.dataFile}:`, error.message);
      return [];
    }
  }

  async migrateCommunity(communityData) {
    try {
      // Check if community already exists by id
      const existingCommunity = await prisma.community.findUnique({
        where: { id: communityData.id }
      });

      if (existingCommunity) {
        console.log(`Community already exists: ${communityData.name}`);
        return true;
      }

      // Create the community
      const newCommunity = await prisma.community.create({
        data: {
          id: communityData.id,
          name: communityData.name,
          description: communityData.description || '',
          url: communityData.url,
          category: communityData.category || [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log(`Created community: ${communityData.name} (ID: ${newCommunity.id})`);
      return true;

    } catch (error) {
      console.error(`Error migrating community ${communityData.name || 'Unknown'}:`, error.message);
      return false;
    }
  }

  async migrateAllCommunities() {
    console.log('Loading communities from JSON file...');
    const communities = await this.loadCommunitiesFromJson();

    if (!communities.length) {
      console.log('No communities found in JSON file!');
      return;
    }

    console.log(`Found ${communities.length} communities to migrate`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < communities.length; i++) {
      const community = communities[i];
      console.log(`Processing community ${i + 1}/${communities.length}: ${community.name || 'Unknown'}`);

      if (await this.migrateCommunity(community)) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    console.log('\nMigration complete!');
    console.log(`Successfully migrated: ${successCount} communities`);
    console.log(`Errors: ${errorCount} communities`);
  }
}

async function main() {
  const migrator = new CommunityMigrator();

  try {
    console.log('Starting community migration...');
    await migrator.migrateAllCommunities();
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