import json
import logging
import hashlib
from datetime import datetime
import requests
from bs4 import BeautifulSoup

try:
    from .base_scraper import BaseScraper, ScraperException
    from .models import Event
except ImportError:
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from base_scraper import BaseScraper, ScraperException
    from models import Event

log = logging.getLogger(__name__)

class AccScraper(BaseScraper):
    def __init__(self):
        super().__init__("acc")
        self.url = "https://www.acc.com/events"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
        }

    def get_events(self):
        try:
            response = requests.get(self.url, headers=self.headers)
            response.raise_for_status()

            # For debugging, save the HTML content
            with open("acc_debug.html", "w", encoding="utf-8") as f:
                f.write(response.text)

            soup = BeautifulSoup(response.text, "html.parser")
            next_data_script = soup.find("script", {"id": "__NEXT_DATA__"})
            
            if not next_data_script:
                raise ScraperException("Could not find __NEXT_DATA__ script tag in the response.")

            json_data = json.loads(next_data_script.string)

            # For debugging, save the extracted JSON
            with open("acc_debug.json", "w", encoding="utf-8") as f:
                json.dump(json_data, f, indent=2)

            events_raw = json_data.get("props", {}).get("pageProps", {}).get("results", [])
            
            if not events_raw:
                log.warning("No events found in __NEXT_DATA__ JSON, but the structure was present.")
                return []

            events = [self._parse_event(item) for item in events_raw if self._parse_event(item)]
            
            log.info(f"Successfully scraped {len(events)} events from {self.url}")
            return events

        except requests.HTTPError as e:
            raise ScraperException(f"HTTP error fetching {self.url}: {e}") from e
        except Exception as e:
            raise ScraperException(f"Failed to scrape events from {self.url}: {e}") from e

    def _parse_event(self, item):
        name = item.get('title')
        if not name:
            return None

        start_date_str = item.get('start_date')
        end_date_str = item.get('end_date')
                
        if not start_date_str:
            return None

        start_datetime_obj = datetime.fromisoformat(start_date_str.replace("Z", "+00:00"))
        end_datetime_obj = datetime.fromisoformat(end_date_str.replace("Z", "+00:00")) if end_date_str else start_datetime_obj

        description = item.get('description')
        url = item.get('url')
        if url and not url.startswith('http'):
            url = f"https://www.acc.com{url}"

        location_parts = [item.get(key) for key in ["venue", "city", "state", "country"]]
        location_str = ", ".join(filter(None, location_parts)) or "Virtual"

        hash_input = f"{name}-{start_datetime_obj}"
        event_id = f"acc-{hashlib.sha256(hash_input.encode('utf-8')).hexdigest()[:10]}"

        return Event(
            id=event_id,
            name=name,
            description=description,
            startDate=start_datetime_obj.isoformat(),
            endDate=end_datetime_obj.isoformat(),
            url=url,
            communityId=self.community_id,
            metadata={"location_string": location_str},
            event_type=item.get('type')
        )

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    scraper = AccScraper()
    try:
        scraped_events = scraper.get_events()
        if scraped_events:
            print(f"Found {len(scraped_events)} events.")
            for event in scraped_events:
                print(json.dumps(event.to_dict(), indent=2))
        else:
            print("No events found. Check 'acc_debug.html' and 'acc_debug.json' for details.")
    except ScraperException as e:
        log.error(f"Scraping failed: {e}") 