#!/usr/bin/env python3
"""
Script to migrate events from JSON files to the database.
This script reads events from public/data/all_events_combined.json and inserts them into the database.
"""

import json
import os
import sys
from datetime import datetime
from typing import Dict, Any, List
import asyncio
from prisma import Prisma

# Add the project root to the path so we can import from src
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class EventMigrator:
    def __init__(self):
        self.prisma = Prisma()
        self.data_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "data", "all_events_combined.json")
        
    async def connect(self):
        """Connect to the database."""
        await self.prisma.connect()
        
    async def disconnect(self):
        """Disconnect from the database."""
        await self.prisma.disconnect()
        
    def load_events_from_json(self) -> List[Dict[str, Any]]:
        """Load events from the JSON file."""
        if not os.path.exists(self.data_file):
            print(f"Error: {self.data_file} not found!")
            return []
            
        with open(self.data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get('events', [])
    
    async def create_or_get_community(self, community_name: str) -> str:
        """Create or get a community by name."""
        if not community_name:
            return None
            
        # Try to find existing community
        existing = await self.prisma.community.find_first(
            where={"name": community_name}
        )
        
        if existing:
            return existing.id
            
        # Create new community
        new_community = await self.prisma.community.create({
            "data": {
                "name": community_name,
                "description": f"Community for {community_name}"
            }
        })
        
        return new_community.id
    
    async def create_or_get_location(self, location_data: Dict[str, Any]) -> str:
        """Create or get a location by address."""
        if not location_data or not location_data.get('address'):
            return None
            
        address = location_data['address']
        
        # Try to find existing location
        existing = await self.prisma.location.find_first(
            where={"address": address}
        )
        
        if existing:
            return existing.id
            
        # Create new location
        new_location = await self.prisma.location.create({
            "data": {
                "name": location_data.get('name', 'Unknown Location'),
                "address": address,
                "city": location_data.get('city', ''),
                "state": location_data.get('state', ''),
                "zip": location_data.get('zip', '')
            }
        })
        
        return new_location.id
    
    async def migrate_event(self, event_data: Dict[str, Any]) -> bool:
        """Migrate a single event to the database."""
        try:
            # Check if event already exists by externalId or name + startDate
            existing_event = None
            if event_data.get('externalId'):
                existing_event = await self.prisma.event.find_unique(
                    where={"externalId": event_data['externalId']}
                )
            
            if not existing_event:
                # Try to find by name and start date
                start_date = datetime.fromisoformat(event_data['startDate'].replace('Z', '+00:00'))
                existing_event = await self.prisma.event.find_first(
                    where={
                        "name": event_data['name'],
                        "startDate": start_date
                    }
                )
            
            if existing_event:
                print(f"Event already exists: {event_data['name']}")
                return True
            
            # Create or get community
            community_id = None
            if event_data.get('community'):
                community_id = await self.create_or_get_community(event_data['community'])
            
            # Create or get location
            location_id = None
            if event_data.get('location'):
                location_id = await self.create_or_get_location(event_data['location'])
            
            # Parse dates
            start_date = datetime.fromisoformat(event_data['startDate'].replace('Z', '+00:00'))
            end_date = datetime.fromisoformat(event_data['endDate'].replace('Z', '+00:00')) if event_data.get('endDate') else start_date
            
            # Create the event
            new_event = await self.prisma.event.create({
                "data": {
                    "externalId": event_data.get('externalId'),
                    "name": event_data['name'],
                    "description": event_data.get('description', ''),
                    "startDate": start_date,
                    "endDate": end_date,
                    "locationName": event_data.get('locationName', ''),
                    "url": event_data.get('url'),
                    "cleCredits": event_data.get('cleCredits'),
                    "status": "PENDING",  # Start as pending for admin review
                    "submittedBy": event_data.get('submittedBy', 'system@migration'),
                    "submittedAt": datetime.now(),
                    "updatedAt": datetime.now(),
                    "updatedBy": 'system@migration',
                    "notes": f"Migrated from JSON file on {datetime.now().isoformat()}",
                    "locationId": location_id,
                    "communityId": community_id
                }
            })
            
            print(f"Created event: {event_data['name']} (ID: {new_event.id})")
            return True
            
        except Exception as e:
            print(f"Error migrating event {event_data.get('name', 'Unknown')}: {e}")
            return False
    
    async def migrate_all_events(self):
        """Migrate all events from JSON to database."""
        print("Loading events from JSON file...")
        events = self.load_events_from_json()
        
        if not events:
            print("No events found in JSON file!")
            return
        
        print(f"Found {len(events)} events to migrate")
        
        success_count = 0
        error_count = 0
        
        for i, event in enumerate(events, 1):
            print(f"Processing event {i}/{len(events)}: {event.get('name', 'Unknown')}")
            
            if await self.migrate_event(event):
                success_count += 1
            else:
                error_count += 1
        
        print(f"\nMigration complete!")
        print(f"Successfully migrated: {success_count} events")
        print(f"Errors: {error_count} events")

async def main():
    """Main function."""
    migrator = EventMigrator()
    
    try:
        print("Connecting to database...")
        await migrator.connect()
        
        print("Starting migration...")
        await migrator.migrate_all_events()
        
    except Exception as e:
        print(f"Error during migration: {e}")
        sys.exit(1)
    finally:
        await migrator.disconnect()

if __name__ == "__main__":
    asyncio.run(main()) 