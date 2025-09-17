import json
import os
import argparse
import hashlib
import sqlite3
from datetime import datetime, timezone
from typing import List, Dict, Any
import sys
import re

# Setup paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(PROJECT_ROOT)

# Import models
try:
    from .models import Event
except ImportError:
    from models import Event

# Check if we're in production (PostgreSQL) or local (SQLite)
DATABASE_URL = os.environ.get("DATABASE_URL", "file:./prisma/events.db")
IS_PRODUCTION = DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgres://")

if IS_PRODUCTION:
    print("Using production PostgreSQL database - this requires API calls")
else:
    print("Using local SQLite database directly")

class ScraperManagerDB:
    """Manages all scrapers and saves directly to database."""

    def __init__(self):
        self.scrapers = {}
        self.db_path = os.path.join(PROJECT_ROOT, "prisma", "events.db") if not IS_PRODUCTION else None
        self.api_url = os.environ.get("VERCEL_URL", "https://legal.somethingtodo.nyc")
        self.secret = os.environ.get("SCRAPER_SECRET")

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
                    try:
                        # Fall back to absolute import
                        module = importlib.import_module(f"scrapers.{module_name}")
                    except ImportError:
                        # Final fallback - direct import
                        module = importlib.import_module(module_name)
                
                klass = getattr(module, class_name)
                self.scrapers[name] = klass(community_id)
                print(f"Successfully loaded {class_name} from {module_name}")
            except Exception as e:
                print(f"Error importing {class_name} from {module_name}: {e}")
                continue
    
    def save_events_to_db(self, events: List[Event], scraper_name: str) -> bool:
        """Save events directly to database using SQLite."""
        if not events:
            print(f"No events to save for {scraper_name}")
            return True

        if IS_PRODUCTION:
            return self._save_events_via_api(events, scraper_name)

        # Local SQLite database
        created_count = 0
        updated_count = 0

        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            for event in events:
                event_dict = event.to_dict()

                # Generate event ID
                event_id = f"evt_{hashlib.sha256((event_dict['name'] + event_dict['startDate'] + str(event_dict.get('communityId', ''))).encode()).hexdigest()[:12]}"

                # Convert ISO strings to datetime objects
                start_date = datetime.fromisoformat(event_dict['startDate'].replace('Z', '+00:00'))
                end_date = datetime.fromisoformat(event_dict.get('endDate', event_dict['startDate']).replace('Z', '+00:00'))
                now = datetime.now(timezone.utc)

                # Check if event exists by externalId first, then by name/startDate/communityId
                existing = None
                if event_dict.get('externalId'):
                    cursor.execute("""
                        SELECT id FROM Event WHERE externalId = ?
                    """, (event_dict['externalId'],))
                    existing = cursor.fetchone()

                if not existing:
                    cursor.execute("""
                        SELECT id FROM Event
                        WHERE name = ? AND startDate = ? AND communityId = ?
                    """, (event_dict['name'], start_date.isoformat(), event_dict.get('communityId')))
                    existing = cursor.fetchone()

                if existing:
                    # Update existing event
                    cursor.execute("""
                        UPDATE Event SET
                            externalId = ?,
                            description = ?,
                            endDate = ?,
                            locationName = ?,
                            url = ?,
                            cleCredits = ?,
                            updatedAt = ?,
                            updatedBy = ?,
                            locationId = ?,
                            communityId = ?,
                            category = ?,
                            tags = ?,
                            eventType = ?,
                            image = ?,
                            price = ?,
                            metadata = ?
                        WHERE id = ?
                    """, (
                        event_dict.get('externalId'),
                        event_dict.get('description', ''),
                        end_date.isoformat(),
                        event_dict.get('locationName', 'TBD'),
                        event_dict.get('url'),
                        event_dict.get('cleCredits'),
                        now.isoformat(),
                        scraper_name,
                        event_dict.get('locationId'),
                        event_dict.get('communityId'),
                        ','.join(event_dict.get('category', [])) if event_dict.get('category') else None,
                        ','.join(event_dict.get('tags', [])) if event_dict.get('tags') else None,
                        event_dict.get('eventType'),
                        event_dict.get('image'),
                        json.dumps(event_dict.get('price')) if event_dict.get('price') else None,
                        json.dumps(event_dict.get('metadata')) if event_dict.get('metadata') else None,
                        existing[0]
                    ))
                    updated_count += 1
                else:
                    # Create new event
                    try:
                        cursor.execute("""
                            INSERT INTO Event (
                                id, externalId, name, description, startDate, endDate,
                                locationName, url, cleCredits, status, submittedBy,
                                submittedAt, updatedAt, updatedBy, locationId, communityId,
                                category, tags, eventType, image, price, metadata
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, (
                            event_id,
                            event_dict.get('externalId'),
                            event_dict['name'],
                            event_dict.get('description', ''),
                            start_date.isoformat(),
                            end_date.isoformat(),
                            event_dict.get('locationName', 'TBD'),
                            event_dict.get('url'),
                            event_dict.get('cleCredits'),
                            'APPROVED',
                            scraper_name,
                            now.isoformat(),
                            now.isoformat(),
                            scraper_name,
                            event_dict.get('locationId'),
                            event_dict.get('communityId'),
                            ','.join(event_dict.get('category', [])) if event_dict.get('category') else None,
                            ','.join(event_dict.get('tags', [])) if event_dict.get('tags') else None,
                            event_dict.get('eventType'),
                            event_dict.get('image'),
                            json.dumps(event_dict.get('price')) if event_dict.get('price') else None,
                            json.dumps(event_dict.get('metadata')) if event_dict.get('metadata') else None
                        ))
                        created_count += 1
                    except sqlite3.IntegrityError as e:
                        if 'UNIQUE constraint failed' in str(e):
                            print(f"Event with externalId {event_dict.get('externalId')} or similar already exists, skipping creation")
                            # Try to find and update the existing event instead
                            if event_dict.get('externalId'):
                                cursor.execute("""
                                    SELECT id FROM Event WHERE externalId = ?
                                """, (event_dict['externalId'],))
                                existing_duplicate = cursor.fetchone()
                                if existing_duplicate:
                                    cursor.execute("""
                                        UPDATE Event SET
                                            description = ?,
                                            endDate = ?,
                                            locationName = ?,
                                            url = ?,
                                            cleCredits = ?,
                                            updatedAt = ?,
                                            updatedBy = ?,
                                            locationId = ?,
                                            communityId = ?,
                                            category = ?,
                                            tags = ?,
                                            eventType = ?,
                                            image = ?,
                                            price = ?,
                                            metadata = ?
                                        WHERE id = ?
                                    """, (
                                        event_dict.get('description', ''),
                                        end_date.isoformat(),
                                        event_dict.get('locationName', 'TBD'),
                                        event_dict.get('url'),
                                        event_dict.get('cleCredits'),
                                        now.isoformat(),
                                        scraper_name,
                                        event_dict.get('locationId'),
                                        event_dict.get('communityId'),
                                        ','.join(event_dict.get('category', [])) if event_dict.get('category') else None,
                                        ','.join(event_dict.get('tags', [])) if event_dict.get('tags') else None,
                                        event_dict.get('eventType'),
                                        event_dict.get('image'),
                                        json.dumps(event_dict.get('price')) if event_dict.get('price') else None,
                                        json.dumps(event_dict.get('metadata')) if event_dict.get('metadata') else None,
                                        existing_duplicate[0]
                                    ))
                                    updated_count += 1
                        else:
                            raise

            conn.commit()

        except Exception as e:
            print(f"Error saving events from {scraper_name}: {e}")
            return False
        finally:
            if 'conn' in locals():
                conn.close()

        print(f"Successfully saved {len(events)} events from {scraper_name}")
        print(f"  - Created: {created_count}")
        print(f"  - Updated: {updated_count}")
        return True

    def _save_events_via_api(self, events: List[Event], scraper_name: str) -> bool:
        """Save events via API call for production database."""
        import requests

        try:
            url = f"https://{self.api_url}/api/events/bulk"
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.secret}'
            }

            events_data = [event.to_dict() for event in events]
            data = {
                'events': events_data,
                'scraper': scraper_name,
                'secret': self.secret
            }

            response = requests.post(url, json=data, headers=headers, timeout=30)
            if response.status_code == 200:
                result = response.json()
                print(f"Successfully saved {len(events)} events from {scraper_name} via API")
                print(f"  - API Response: Created {result.get('created', 0)}, Updated {result.get('updated', 0)}")
                if result.get('errors'):
                    print(f"  - API Errors: {result['errors']}")
                return True
            else:
                print(f"Failed to save events via API: {response.status_code} - {response.text}")
                return False

        except Exception as e:
            print(f"Error saving events via API from {scraper_name}: {e}")
            return False
    
    def run_scraper(self, name: str) -> List[Event]:
        """Run a single scraper and send results to database."""
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
        """Run all scrapers and send results to database."""
        results = {}
        total_events = 0

        print(f"Starting scraper run at {datetime.now(timezone.utc).isoformat()}")

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