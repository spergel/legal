#!/usr/bin/env node
/**
 * Import scraped events from JSON files into the database
 * This script reads all the JSON files generated by the scrapers and imports them
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Function to sanitize event data for database insertion (matching data-loader.ts logic)
function sanitizeEvent(eventData) {
    // Provide default dates if they're missing (required by Prisma schema)
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() + 30); // Default to 30 days from now
    
    const defaultEndDate = new Date(defaultStartDate);
    defaultEndDate.setHours(defaultEndDate.getHours() + 2); // Default to 2 hours later
    
    return {
        name: eventData.name || 'Untitled Event',
        description: eventData.description || 'No description available',
        locationName: eventData.location || eventData.locationName || 'Location TBD',
        startDate: eventData.start_date ? new Date(eventData.start_date) : defaultStartDate,
        endDate: eventData.end_date ? new Date(eventData.end_date) : defaultEndDate,
        url: eventData.url || null,
        image: eventData.image || null,
        price: eventData.price || null,
        cleCredits: eventData.cle_credits || null,
        category: Array.isArray(eventData.category) ? eventData.category : [],
        tags: Array.isArray(eventData.tags) ? eventData.tags : [],
        eventType: eventData.event_type || null,
        metadata: eventData.metadata || null,
        status: 'APPROVED',
        submittedAt: new Date(),
        updatedAt: new Date(),
        submittedBy: 'scraper',
        updatedBy: 'scraper'
    };
}

// Function to import events from a single JSON file
async function importEventsFromFile(filePath) {
    try {
        console.log(`📁 Reading file: ${path.basename(filePath)}`);
        
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(fileContent);
        
        if (!data.events || !Array.isArray(data.events)) {
            console.log(`⚠️  No events found in ${path.basename(filePath)}`);
            return { imported: 0, errors: 0 };
        }
        
        console.log(`📊 Found ${data.events.length} events in ${path.basename(filePath)}`);
        
        let imported = 0;
        let errors = 0;
        
        for (const eventData of data.events) {
            try {
                const sanitizedEvent = sanitizeEvent(eventData);
                
                // Check if event already exists (by name only, since start date might be null)
                const existingEvent = await prisma.event.findFirst({
                    where: {
                        name: sanitizedEvent.name
                    }
                });
                
                if (existingEvent) {
                    // Update existing event
                    await prisma.event.update({
                        where: { id: existingEvent.id },
                        data: sanitizedEvent
                    });
                    console.log(`🔄 Updated: ${sanitizedEvent.name.substring(0, 50)}...`);
                } else {
                    // Create new event
                    await prisma.event.create({
                        data: sanitizedEvent
                    });
                    console.log(`✅ Created: ${sanitizedEvent.name.substring(0, 50)}...`);
                }
                
                imported++;
            } catch (error) {
                console.error(`❌ Error importing event: ${error.message}`);
                errors++;
            }
        }
        
        return { imported, errors };
        
    } catch (error) {
        console.error(`❌ Error reading file ${filePath}: ${error.message}`);
        return { imported: 0, errors: 1 };
    }
}

// Main function to import all events
async function importAllEvents() {
    const dataDir = path.join(__dirname, '../scrapers/data');
    
    try {
        console.log('🚀 Starting event import process...');
        console.log(`📂 Reading from directory: ${dataDir}`);
        
        // Get all JSON files in the data directory
        const files = fs.readdirSync(dataDir)
            .filter(file => file.endsWith('.json') && file.includes('_events.json'))
            .map(file => path.join(dataDir, file));
        
        console.log(`📋 Found ${files.length} event files to process`);
        console.log('=' * 80);
        
        let totalImported = 0;
        let totalErrors = 0;
        const results = {};
        
        for (const file of files) {
            const fileName = path.basename(file);
            console.log(`\n📊 Processing: ${fileName}`);
            
            const result = await importEventsFromFile(file);
            results[fileName] = result;
            totalImported += result.imported;
            totalErrors += result.errors;
            
            console.log(`   ✅ Imported: ${result.imported}, ❌ Errors: ${result.errors}`);
        }
        
        console.log('\n' + '=' * 80);
        console.log('🎉 Import process completed!');
        console.log(`📊 Summary:`);
        console.log(`   • Files processed: ${files.length}`);
        console.log(`   • Total events imported: ${totalImported}`);
        console.log(`   • Total errors: ${totalErrors}`);
        
        // Show breakdown by file
        console.log(`\n📋 Breakdown by file:`);
        for (const [fileName, result] of Object.entries(results)) {
            console.log(`   • ${fileName}: ${result.imported} imported, ${result.errors} errors`);
        }
        
        // Get database stats
        const totalEvents = await prisma.event.count();
        const activeEvents = await prisma.event.count({ 
            where: { status: 'APPROVED' } 
        });
        
        console.log(`\n🗄️  Database stats:`);
        console.log(`   • Total events in database: ${totalEvents}`);
        console.log(`   • Approved events: ${activeEvents}`);
        
        return { totalImported, totalErrors, results };
        
    } catch (error) {
        console.error(`❌ Fatal error: ${error.message}`);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the import if this script is executed directly
if (require.main === module) {
    importAllEvents()
        .then(() => {
            console.log('\n✅ Import completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error(`❌ Import failed: ${error.message}`);
            process.exit(1);
        });
}

module.exports = { importAllEvents, importEventsFromFile }; 
/**
 * Import scraped events from JSON files into the database
 * This script reads all the JSON files generated by the scrapers and imports them
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Function to sanitize event data for database insertion (matching data-loader.ts logic)
function sanitizeEvent(eventData) {
    // Provide default dates if they're missing (required by Prisma schema)
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() + 30); // Default to 30 days from now
    
    const defaultEndDate = new Date(defaultStartDate);
    defaultEndDate.setHours(defaultEndDate.getHours() + 2); // Default to 2 hours later
    
    return {
        name: eventData.name || 'Untitled Event',
        description: eventData.description || 'No description available',
        locationName: eventData.location || eventData.locationName || 'Location TBD',
        startDate: eventData.start_date ? new Date(eventData.start_date) : defaultStartDate,
        endDate: eventData.end_date ? new Date(eventData.end_date) : defaultEndDate,
        url: eventData.url || null,
        image: eventData.image || null,
        price: eventData.price || null,
        cleCredits: eventData.cle_credits || null,
        category: Array.isArray(eventData.category) ? eventData.category : [],
        tags: Array.isArray(eventData.tags) ? eventData.tags : [],
        eventType: eventData.event_type || null,
        metadata: eventData.metadata || null,
        status: 'APPROVED',
        submittedAt: new Date(),
        updatedAt: new Date(),
        submittedBy: 'scraper',
        updatedBy: 'scraper'
    };
}

// Function to import events from a single JSON file
async function importEventsFromFile(filePath) {
    try {
        console.log(`📁 Reading file: ${path.basename(filePath)}`);
        
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(fileContent);
        
        if (!data.events || !Array.isArray(data.events)) {
            console.log(`⚠️  No events found in ${path.basename(filePath)}`);
            return { imported: 0, errors: 0 };
        }
        
        console.log(`📊 Found ${data.events.length} events in ${path.basename(filePath)}`);
        
        let imported = 0;
        let errors = 0;
        
        for (const eventData of data.events) {
            try {
                const sanitizedEvent = sanitizeEvent(eventData);
                
                // Check if event already exists (by name only, since start date might be null)
                const existingEvent = await prisma.event.findFirst({
                    where: {
                        name: sanitizedEvent.name
                    }
                });
                
                if (existingEvent) {
                    // Update existing event
                    await prisma.event.update({
                        where: { id: existingEvent.id },
                        data: sanitizedEvent
                    });
                    console.log(`🔄 Updated: ${sanitizedEvent.name.substring(0, 50)}...`);
                } else {
                    // Create new event
                    await prisma.event.create({
                        data: sanitizedEvent
                    });
                    console.log(`✅ Created: ${sanitizedEvent.name.substring(0, 50)}...`);
                }
                
                imported++;
            } catch (error) {
                console.error(`❌ Error importing event: ${error.message}`);
                errors++;
            }
        }
        
        return { imported, errors };
        
    } catch (error) {
        console.error(`❌ Error reading file ${filePath}: ${error.message}`);
        return { imported: 0, errors: 1 };
    }
}

// Main function to import all events
async function importAllEvents() {
    const dataDir = path.join(__dirname, '../scrapers/data');
    
    try {
        console.log('🚀 Starting event import process...');
        console.log(`📂 Reading from directory: ${dataDir}`);
        
        // Get all JSON files in the data directory
        const files = fs.readdirSync(dataDir)
            .filter(file => file.endsWith('.json') && file.includes('_events.json'))
            .map(file => path.join(dataDir, file));
        
        console.log(`📋 Found ${files.length} event files to process`);
        console.log('=' * 80);
        
        let totalImported = 0;
        let totalErrors = 0;
        const results = {};
        
        for (const file of files) {
            const fileName = path.basename(file);
            console.log(`\n📊 Processing: ${fileName}`);
            
            const result = await importEventsFromFile(file);
            results[fileName] = result;
            totalImported += result.imported;
            totalErrors += result.errors;
            
            console.log(`   ✅ Imported: ${result.imported}, ❌ Errors: ${result.errors}`);
        }
        
        console.log('\n' + '=' * 80);
        console.log('🎉 Import process completed!');
        console.log(`📊 Summary:`);
        console.log(`   • Files processed: ${files.length}`);
        console.log(`   • Total events imported: ${totalImported}`);
        console.log(`   • Total errors: ${totalErrors}`);
        
        // Show breakdown by file
        console.log(`\n📋 Breakdown by file:`);
        for (const [fileName, result] of Object.entries(results)) {
            console.log(`   • ${fileName}: ${result.imported} imported, ${result.errors} errors`);
        }
        
        // Get database stats
        const totalEvents = await prisma.event.count();
        const activeEvents = await prisma.event.count({ 
            where: { status: 'APPROVED' } 
        });
        
        console.log(`\n🗄️  Database stats:`);
        console.log(`   • Total events in database: ${totalEvents}`);
        console.log(`   • Approved events: ${activeEvents}`);
        
        return { totalImported, totalErrors, results };
        
    } catch (error) {
        console.error(`❌ Fatal error: ${error.message}`);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the import if this script is executed directly
if (require.main === module) {
    importAllEvents()
        .then(() => {
            console.log('\n✅ Import completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error(`❌ Import failed: ${error.message}`);
            process.exit(1);
        });
}

module.exports = { importAllEvents, importEventsFromFile }; 