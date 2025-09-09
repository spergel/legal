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

# Use SQLite directly
import sqlite3

DATABASE_URL = os.environ.get("DATABASE_URL", "file:./prisma/events.db")
DB_PATH = DATABASE_URL.replace("file:", "")

print(f"Using database: {DB_PATH}")

class ScraperManagerDB:
    """Manages all scrapers and saves directly to database."""
    
    def __init__(self):
        self.scrapers = {}
        self.db_path = DB_PATH

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
    
    def save_events_to_db(self, events: List[Event], scraper_name: str) -> bool:
        """Save events directly to database."""
        if not events:
            print(f"No events to save for {scraper_name}")
            return True
            
        created_count = 0
        updated_count = 0
        
        for event in events:
            event_dict = event.to_dict()
            
            # Convert arrays to comma-separated strings for SQLite
            if event_dict.get('category') and isinstance(event_dict['category'], list):
                event_dict['category'] = ','.join(event_dict['category'])
            elif not event_dict.get('category'):
                event_dict['category'] = None
                
            if event_dict.get('tags') and isinstance(event_dict['tags'], list):
                event_dict['tags'] = ','.join(event_dict['tags'])
            elif not event_dict.get('tags'):
                event_dict['tags'] = None
                
            if event_dict.get('price') and isinstance(event_dict['price'], dict):
                event_dict['price'] = json.dumps(event_dict['price'])
            elif not event_dict.get('price'):
                event_dict['price'] = None
                
            if event_dict.get('metadata') and isinstance(event_dict['metadata'], dict):
                event_dict['metadata'] = json.dumps(event_dict['metadata'])
            elif not event_dict.get('metadata'):
                event_dict['metadata'] = None
            
            try:
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()
                
                # Check if event exists
                cursor.execute("""
                    SELECT id, updatedAt FROM Event 
                    WHERE name = ? AND startDate = ? AND communityId = ?
                """, (
                    event_dict['name'],
                    event_dict['startDate'],
                    event_dict.get('communityId')
                ))
                
                existing = cursor.fetchone()
                now = datetime.now(timezone.utc).isoformat()
                
                if existing:
                    # Update existing event
                    cursor.execute("""
                        UPDATE Event SET
                            externalId = ?, description = ?, endDate = ?, locationName = ?,
                            url = ?, cleCredits = ?, updatedAt = ?, updatedBy = ?,
                            notes = ?, locationId = ?, communityId = ?, category = ?,
                            tags = ?, eventType = ?, image = ?, price = ?, metadata = ?
                        WHERE id = ?
                    """, (
                        event_dict.get('externalId'),
                        event_dict.get('description', ''),
                        event_dict.get('endDate'),
                        event_dict.get('locationName', 'TBD'),
                        event_dict.get('url'),
                        event_dict.get('cleCredits'),
                        now,
                        scraper_name,
                        event_dict.get('notes'),
                        event_dict.get('locationId'),
                        event_dict.get('communityId'),
                        event_dict.get('category'),
                        event_dict.get('tags'),
                        event_dict.get('eventType'),
                        event_dict.get('image'),
                        event_dict.get('price'),
                        event_dict.get('metadata'),
                        existing[0]
                    ))
                    updated_count += 1
                else:
                    # Create new event
                    cursor.execute("""
                        INSERT INTO Event (
                            id, externalId, name, description, startDate, endDate, locationName,
                            url, cleCredits, status, submittedBy, submittedAt, updatedAt,
                            updatedBy, notes, locationId, communityId, category, tags,
                            eventType, image, price, metadata
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        f"evt_{hashlib.sha256((event_dict['name'] + event_dict['startDate'] + str(event_dict.get('communityId', ''))).encode()).hexdigest()[:12]}",
                        event_dict.get('externalId'),
                        event_dict['name'],
                        event_dict.get('description', ''),
                        event_dict['startDate'],
                        event_dict.get('endDate'),
                        event_dict.get('locationName', 'TBD'),
                        event_dict.get('url'),
                        event_dict.get('cleCredits'),
                        'APPROVED',
                        scraper_name,
                        now,
                        now,
                        scraper_name,
                        event_dict.get('notes'),
                        event_dict.get('locationId'),
                        event_dict.get('communityId'),
                        event_dict.get('category'),
                        event_dict.get('tags'),
                        event_dict.get('eventType'),
                        event_dict.get('image'),
                        event_dict.get('price'),
                        event_dict.get('metadata')
                    ))
                    created_count += 1
                
                conn.commit()
                conn.close()
                    
            except Exception as e:
                print(f"Error saving event '{event_dict['name']}': {e}")
                continue
        
        print(f"Successfully saved {len(events)} events from {scraper_name}")
        print(f"  - Created: {created_count}")
        print(f"  - Updated: {updated_count}")
        return True
    
    def run_scraper(self, name: str) -> List[Event]:
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
            success = self.save_events_to_db(events, name)
            if success:
                print(f"Successfully processed {name} scraper")
            else:
                print(f"Failed to save events from {name} to database")
                
            return events
        except Exception as e:
            print(f"Error running {name} scraper: {e}")
            return []
    
    def run_all(self) -> Dict[str, List[Event]]:
        """Run all scrapers and send results to API."""
        results = {}
        total_events = 0
        
        print(f"Starting scraper run at {datetime.now(timezone.utc).isoformat()}")
        print(f"API URL: {self.api_url}")
        
        for name, scraper in self.scrapers.items():
            try:
                events = self.run_scraper(name)
                results[name] = events
                total_events += len(events)
            except Exception as e:
                print(f"Error running {name} scraper: {e}")
                results[name] = []
        
        print(f"Scraper run completed. Total events processed: {total_events}")
        return results
    
    def run(self, only_scraper: str = None) -> None:
        """Run all scrapers or a single scraper."""
        if only_scraper:
            self.run_scraper(only_scraper)
        else:
            self.run_all()

def main():
    parser = argparse.ArgumentParser(description="Run legal event scrapers and send to database.")
    parser.add_argument('--scraper', type=str, help='Name of a single scraper to run (e.g. nycbar, fordham, lawyers_alliance, nyiac, google_calendar, ics_calendar)')
    args = parser.parse_args()
    
    try:
        manager = ScraperManagerDB()
        manager.run(only_scraper=args.scraper)
    except Exception as e:
        print(f"Fatal error: {e}")
        exit(1)

if __name__ == "__main__":
    main() 