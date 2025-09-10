import json
import os
import argparse
import hashlib
from datetime import datetime, timezone
from typing import List, Dict, Any
from .models import Event
import sys
import re

# Setup paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(PROJECT_ROOT)

# Use Prisma for database operations
from prisma import Prisma

# Check if we're in production (PostgreSQL) or local (SQLite)
DATABASE_URL = os.environ.get("DATABASE_URL", "file:./prisma/events.db")
IS_PRODUCTION = DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgres://")

if IS_PRODUCTION:
    print("Using production PostgreSQL database via Prisma")
else:
    print("Using local SQLite database via Prisma")

class ScraperManagerDB:
    """Manages all scrapers and saves directly to database."""
    
    def __init__(self):
        self.scrapers = {}
        self.prisma = Prisma()
        self.api_url = os.environ.get("VERCEL_URL", "https://lawyerevents.net")

        # Lazy import and instantiate scrapers
        scraper_configs = [
            ("aabany_rss", "aabany_rss_scraper", "AabanyRssScraper", "com_aabany_rss"),
            ("brooklynbar", "brooklynbar_scraper", "BrooklynBarScraper", "com_brooklynbar"),
            ("nysba", "nysba_scraper", "NYSBAScraper", "com_nysba"),
            ("hnba_ics", "hnba_ics_scraper", "HNBAICSScraper", "com_hnba_ics"),
            ("lgbtbarny", "lgbtbarny_scraper", "LgbtBarNyScraper", "com_lgbtbarny"),
            ("wbasny", "wbasny_scraper", "WBASNYScraper", "com_wbasny"),
            ("nawl", "nawl_scraper", "NAWLScraper", "com_nawl"),
            ("fedbar_ics", "fedbar_ics_scraper", "FBAICSScraper", "com_fedbar_ics"),
            ("cuny_law_ics", "cuny_law_ics_scraper", "CUNYLawICSScraper", "com_cuny_law_ics"),
            ("chips_network", "chips_network_scraper", "ChIPsNetworkScraper", "com_chips_network"),
            ("nycbar", "nycbar_scraper", "NYCBarScraper", "com_nycbar"),
            ("fordham", "fordham_scraper", "FordhamScraper", "com_fordham"),
            ("nyiac", "nyiac_scraper", "NYIACScraper", "com_nyiac"),
        ]
        
        for name, module_name, class_name, community_id in scraper_configs:
            try:
                # Use importlib for more reliable imports
                import importlib
                try:
                    # Try relative import first (when running as module)
                    module = importlib.import_module(f".{module_name}", package="scrapers")
                except ImportError:
                    # Fall back to absolute import
                    module = importlib.import_module(f"scrapers.{module_name}")
                
                klass = getattr(module, class_name)
                self.scrapers[name] = klass(community_id)
                print(f"Successfully loaded {class_name} from {module_name}")
            except Exception as e:
                print(f"Error importing {class_name} from {module_name}: {e}")
                continue
    
    async def save_events_to_db(self, events: List[Event], scraper_name: str) -> bool:
        """Save events directly to database using Prisma."""
        if not events:
            print(f"No events to save for {scraper_name}")
            return True
            
        created_count = 0
        updated_count = 0
        
        try:
            await self.prisma.connect()
            
            for event in events:
                event_dict = event.to_dict()
                
                # Generate event ID
                event_id = f"evt_{hashlib.sha256((event_dict['name'] + event_dict['startDate'] + str(event_dict.get('communityId', ''))).encode()).hexdigest()[:12]}"
                
                # Check if event exists
                existing = await self.prisma.event.find_first(
                    where={
                        'name': event_dict['name'],
                        'startDate': event_dict['startDate'],
                        'communityId': event_dict.get('communityId')
                    }
                )
                
                now = datetime.now(timezone.utc)
                
                if existing:
                    # Update existing event
                    await self.prisma.event.update(
                        where={'id': existing.id},
                        data={
                            'externalId': event_dict.get('externalId'),
                            'description': event_dict.get('description', ''),
                            'endDate': event_dict.get('endDate'),
                            'locationName': event_dict.get('locationName', 'TBD'),
                            'url': event_dict.get('url'),
                            'cleCredits': event_dict.get('cleCredits'),
                            'updatedAt': now,
                            'updatedBy': scraper_name,
                            'notes': event_dict.get('notes'),
                            'locationId': event_dict.get('locationId'),
                            'communityId': event_dict.get('communityId'),
                            'category': event_dict.get('category', []),
                            'tags': event_dict.get('tags', []),
                            'eventType': event_dict.get('eventType'),
                            'image': event_dict.get('image'),
                            'price': event_dict.get('price'),
                            'metadata': event_dict.get('metadata')
                        }
                    )
                    updated_count += 1
                else:
                    # Create new event
                    await self.prisma.event.create(
                        data={
                            'id': event_id,
                            'externalId': event_dict.get('externalId'),
                            'name': event_dict['name'],
                            'description': event_dict.get('description', ''),
                            'startDate': event_dict['startDate'],
                            'endDate': event_dict.get('endDate'),
                            'locationName': event_dict.get('locationName', 'TBD'),
                            'url': event_dict.get('url'),
                            'cleCredits': event_dict.get('cleCredits'),
                            'status': 'APPROVED',
                            'submittedBy': scraper_name,
                            'submittedAt': now,
                            'updatedAt': now,
                            'updatedBy': scraper_name,
                            'notes': event_dict.get('notes'),
                            'locationId': event_dict.get('locationId'),
                            'communityId': event_dict.get('communityId'),
                            'category': event_dict.get('category', []),
                            'tags': event_dict.get('tags', []),
                            'eventType': event_dict.get('eventType'),
                            'image': event_dict.get('image'),
                            'price': event_dict.get('price'),
                            'metadata': event_dict.get('metadata')
                        }
                    )
                    created_count += 1
                    
        except Exception as e:
            print(f"Error saving events from {scraper_name}: {e}")
            return False
        finally:
            await self.prisma.disconnect()
        
        print(f"Successfully saved {len(events)} events from {scraper_name}")
        print(f"  - Created: {created_count}")
        print(f"  - Updated: {updated_count}")
        return True
    
    async def run_scraper(self, name: str) -> List[Event]:
        """Run a single scraper and send results to API."""
        scraper = self.scrapers.get(name)
        if not scraper:
            print(f"Scraper '{name}' not found.")
            return []
            
        try:
            print(f"Running {name} scraper...")
            events = scraper.run()
            print(f"Found {len(events)} events from {name}")
            
            # Save to database
            success = await self.save_events_to_db(events, name)
            if success:
                print(f"Successfully processed {name} scraper")
            else:
                print(f"Failed to save events from {name} to database")
                
            return events
        except Exception as e:
            print(f"Error running {name} scraper: {e}")
            return []
    
    async def run_all(self) -> Dict[str, List[Event]]:
        """Run all scrapers and send results to API."""
        results = {}
        total_events = 0
        
        print(f"Starting scraper run at {datetime.now(timezone.utc).isoformat()}")
        
        for name, scraper in self.scrapers.items():
            try:
                events = await self.run_scraper(name)
                results[name] = events
                total_events += len(events)
            except Exception as e:
                print(f"Error running {name} scraper: {e}")
                results[name] = []
        
        print(f"Scraper run completed. Total events processed: {total_events}")
        return results
    
    async def run(self, only_scraper: str = None) -> None:
        """Run all scrapers or a single scraper."""
        if only_scraper:
            await self.run_scraper(only_scraper)
        else:
            await self.run_all()

async def main():
    parser = argparse.ArgumentParser(description="Run legal event scrapers and send to database.")
    parser.add_argument('--scraper', type=str, help='Name of a single scraper to run (e.g. nycbar, fordham, lawyers_alliance, nyiac, google_calendar, ics_calendar)')
    args = parser.parse_args()
    
    try:
        manager = ScraperManagerDB()
        await manager.run(only_scraper=args.scraper)
    except Exception as e:
        print(f"Fatal error: {e}")
        exit(1)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main()) 