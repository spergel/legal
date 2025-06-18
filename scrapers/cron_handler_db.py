import json
import os
import argparse
from datetime import datetime, timezone
from typing import List, Dict, Any
from models import Event
import asyncio
from prisma import Prisma

# NOTE: This version saves events directly to the database instead of JSON files.

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

class ScraperManagerDB:
    """Manages all scrapers and saves events directly to the database."""
    
    def __init__(self):
        self.scrapers = {}
        self.prisma = Prisma()

        # Lazy import and instantiate scrapers
        scraper_configs = [
            ("nycbar", "nycbar_scraper", "NYCBarScraper", "com_nycbar"),
            ("fordham", "fordham_scraper", "FordhamScraper", "com_fordham"),
            ("lawyers_alliance", "lawyers_alliance_scraper", "LawyersAllianceScraper", "com_lawyers_alliance"),
            ("nyiac", "nyiac_scraper", "NYIACScraper", "com_nyiac"),
            ("google_calendar", "google_calendar_scraper", "GoogleCalendarScraper", "com_google_calendar"),
            ("ics_calendar", "ics_calendar_scraper", "ICSCalendarScraper", "com_ics_calendar"),
        ]
        for name, module_name, class_name, community_id in scraper_configs:
            try:
                module = __import__(module_name, fromlist=[class_name])
                klass = getattr(module, class_name)
                self.scrapers[name] = klass(community_id)
            except Exception as e:
                print(f"Error importing {class_name} from {module_name}: {e}")
                continue
    
    async def connect(self):
        """Connect to the database."""
        await self.prisma.connect()
    
    async def disconnect(self):
        """Disconnect from the database."""
        await self.prisma.disconnect()
    
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
    
    async def save_event_to_db(self, event_data: Dict[str, Any]) -> bool:
        """Save a single event to the database."""
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
            
            # Create the event - AUTO APPROVE scraped events
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
                    "status": "APPROVED",  # Auto-approve scraped events
                    "submittedBy": event_data.get('submittedBy', 'system@scraper'),
                    "submittedAt": datetime.now(),
                    "updatedAt": datetime.now(),
                    "updatedBy": 'system@scraper',
                    "notes": f"Auto-approved scraped event from {event_data.get('source', 'unknown')} on {datetime.now().isoformat()}",
                    "locationId": location_id,
                    "communityId": community_id
                }
            })
            
            print(f"Created and approved event: {event_data['name']} (ID: {new_event.id})")
            return True
            
        except Exception as e:
            print(f"Error saving event {event_data.get('name', 'Unknown')}: {e}")
            return False
    
    async def run_scraper(self, name: str) -> List[Event]:
        """Run a single scraper and save results to database."""
        scraper = self.scrapers.get(name)
        if not scraper:
            print(f"Scraper '{name}' not found.")
            return []
        try:
            events = scraper.run()
            print(f"Running {name} scraper, found {len(events)} events")
            
            # Save each event to database
            success_count = 0
            for event in events:
                event_dict = event.to_dict()
                event_dict['source'] = name  # Add source info
                if await self.save_event_to_db(event_dict):
                    success_count += 1
            
            print(f"Successfully saved {success_count}/{len(events)} events from {name} scraper")
            return events
        except Exception as e:
            print(f"Error running {name} scraper: {e}")
            return []
    
    async def run_all(self) -> Dict[str, List[Event]]:
        """Run all scrapers and save results to database."""
        results = {}
        for name, scraper in self.scrapers.items():
            try:
                events = scraper.run()
                results[name] = events
                print(f"Running {name} scraper, found {len(events)} events")
                
                # Save each event to database
                success_count = 0
                for event in events:
                    event_dict = event.to_dict()
                    event_dict['source'] = name  # Add source info
                    if await self.save_event_to_db(event_dict):
                        success_count += 1
                
                print(f"Successfully saved {success_count}/{len(events)} events from {name} scraper")
                
            except Exception as e:
                print(f"Error running {name} scraper: {e}")
                results[name] = []
        return results
    
    async def run(self, only_scraper: str = None) -> None:
        """Run all scrapers or a single scraper and save to database."""
        try:
            await self.connect()
            
            if only_scraper:
                await self.run_scraper(only_scraper)
            else:
                await self.run_all()
                
        except Exception as e:
            print(f"Error during scraping: {e}")
        finally:
            await self.disconnect()

async def main():
    parser = argparse.ArgumentParser(description="Run legal event scrapers and save to database.")
    parser.add_argument('--scraper', type=str, help='Name of a single scraper to run (e.g. nycbar, fordham, lawyers_alliance, nyiac, google_calendar, ics_calendar)')
    args = parser.parse_args()
    manager = ScraperManagerDB()
    await manager.run(only_scraper=args.scraper)

if __name__ == "__main__":
    asyncio.run(main()) 