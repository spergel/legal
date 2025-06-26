import json
import os
import requests
import argparse
from datetime import datetime, timezone
from typing import List, Dict, Any
from models import Event
import sys

# Setup paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(PROJECT_ROOT)

# Use VERCEL_URL for the API URL if available, otherwise default to localhost
API_URL = os.environ.get("VERCEL_URL")
if API_URL:
    # Ensure the URL is properly formatted for Vercel
    API_URL = f"https://{API_URL}"
else:
    API_URL = "http://localhost:3000"

SCRAPER_SECRET = os.environ.get("SCRAPER_SECRET")
DATABASE_URL = os.environ.get("DATABASE_URL")

print(f"Cron handler using API URL: {API_URL}")
print(f"VERCEL_URL environment variable: {os.environ.get('VERCEL_URL', 'NOT_SET')}")
print(f"SCRAPER_SECRET set: {'YES' if SCRAPER_SECRET else 'NO'}")

class ScraperManagerDB:
    """Manages all scrapers and sends their output to the database via API."""
    
    def __init__(self):
        self.scrapers = {}
        # Get the base URL, default to localhost for local dev
        base_url = API_URL
        
        self.api_url = base_url
        self.scraper_secret = SCRAPER_SECRET
        
        if not self.scraper_secret:
            raise ValueError("SCRAPER_SECRET environment variable is required")

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
                module = __import__(module_name, fromlist=[class_name])
                klass = getattr(module, class_name)
                self.scrapers[name] = klass(community_id)
            except Exception as e:
                print(f"Error importing {class_name} from {module_name}: {e}")
                continue
    
    def send_events_to_api(self, events: List[Event], scraper_name: str) -> bool:
        """Send events to the Vercel API endpoint."""
        if not events:
            print(f"No events to send for {scraper_name}")
            return True
            
        api_endpoint = f"{self.api_url}/api/admin/upsert-events"
        
        # Convert events to the format expected by the API
        events_data = []
        for event in events:
            event_dict = event.to_dict()
            # Add scraper metadata
            event_dict['scraper_name'] = scraper_name
            event_dict['scraped_at'] = datetime.now(timezone.utc).isoformat()
            events_data.append(event_dict)
        
        payload = {
            "events": events_data,
            "secret": self.scraper_secret
        }
        
        try:
            response = requests.post(
                api_endpoint,
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"Successfully sent {len(events)} events from {scraper_name} to API")
                if 'created' in result:
                    print(f"  - Created: {result['created']}")
                if 'updated' in result:
                    print(f"  - Updated: {result['updated']}")
                return True
            else:
                print(f"Error sending events from {scraper_name}: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"Exception sending events from {scraper_name}: {e}")
            return False
    
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
            
            # Send to API
            success = self.send_events_to_api(events, name)
            if success:
                print(f"Successfully processed {name} scraper")
            else:
                print(f"Failed to send events from {name} to API")
                
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