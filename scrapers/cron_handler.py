import json
import os
import argparse
from datetime import datetime, timezone
from typing import List, Dict, Any
from models import Event

# NOTE: This is the only script that should write to public/data. All other scrapers should write to scrapers/data.

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

class ScraperManager:
    """Manages all scrapers and combines their output."""
    
    def __init__(self):
        self.scrapers = {}
        # Save to public/data directory
        self.data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "data")
        os.makedirs(self.data_dir, exist_ok=True)

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
    
    def run_scraper(self, name: str) -> List[Event]:
        """Run a single scraper and return its results."""
        scraper = self.scrapers.get(name)
        if not scraper:
            print(f"Scraper '{name}' not found.")
            return []
        try:
            events = scraper.run()
            self.save_scraper_results(name, events)
            return events
        except Exception as e:
            print(f"Error running {name} scraper: {e}")
            return []
    
    def run_all(self) -> Dict[str, List[Event]]:
        """Run all scrapers and return their results."""
        results = {}
        for name, scraper in self.scrapers.items():
            try:
                events = scraper.run()
                results[name] = events
            except Exception as e:
                print(f"Error running {name} scraper: {e}")
                results[name] = []
        return results
    
    def save_scraper_results(self, name: str, events: List[Event]) -> None:
        """Save individual scraper results to a JSON file."""
        output = {
            "last_updated_utc": datetime.now(timezone.utc).isoformat(),
            "total_events": len(events),
            "events": [event.to_dict() for event in events]
        }
        filepath = os.path.join(self.data_dir, f"{name}_events.json")
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2)
    
    def combine_events(self, results: Dict[str, List[Event]]) -> List[Dict[str, Any]]:
        """Combine events from all scrapers into a single list."""
        all_events = []
        for events in results.values():
            all_events.extend([event.to_dict() for event in events])
        return all_events
    
    def save_combined(self, events: List[Dict[str, Any]]) -> None:
        """Save combined events to a JSON file."""
        output = {
            "last_updated_utc": datetime.now(timezone.utc).isoformat(),
            "total_events_combined": len(events),
            "events": events
        }
        filepath = os.path.join(self.data_dir, "all_events_combined.json")
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2)
    
    def run(self, only_scraper: str = None) -> None:
        """Run all scrapers or a single scraper and save results appropriately."""
        if only_scraper:
            self.run_scraper(only_scraper)
        else:
            results = self.run_all()
            combined_events = self.combine_events(results)
            self.save_combined(combined_events)

def main():
    parser = argparse.ArgumentParser(description="Run legal event scrapers.")
    parser.add_argument('--scraper', type=str, help='Name of a single scraper to run (e.g. nycbar, fordham, lawyers_alliance, nyiac, google_calendar, ics_calendar)')
    args = parser.parse_args()
    manager = ScraperManager()
    manager.run(only_scraper=args.scraper)

if __name__ == "__main__":
    main() 