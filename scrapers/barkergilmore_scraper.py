import os
import requests
from bs4 import BeautifulSoup
from typing import List
from datetime import datetime
import hashlib
import sys
import re
import logging
import json

# Adjust path to import from parent directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))
sys.path.append(PROJECT_ROOT)

from scrapers.base_scraper import BaseScraper
from scrapers.models import Event
from scrapers.categorization_helper import EventCategorizer

logger = logging.getLogger(__name__)

class BarkerGilmoreScraper(BaseScraper):
    """Scraper for BarkerGilmore webinars."""
    def __init__(self, community_id: str = "com_barkergilmore"):
        super().__init__(community_id)
        self.base_url = "https://www.barkergilmore.com"
        self.webinars_url = f"{self.base_url}/content_type/webinar/"

    def get_events(self) -> List[Event]:
        events = []
        try:
            response = self.session.get(self.webinars_url, timeout=30)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')

            event_containers = soup.select('div.fusion-posts-container article.post')
            if not event_containers:
                logger.info("No event containers found on BarkerGilmore website.")
                return events

            for container in event_containers:
                try:
                    title_tag = container.select_one('h2.blog-shortcode-post-title a')
                    if not title_tag:
                        continue
                    
                    name = title_tag.get_text(strip=True)
                    url = title_tag['href']

                    date_str = None
                    meta_info_tag = container.select_one('p.fusion-single-line-meta')
                    if meta_info_tag:
                        meta_text = meta_info_tag.get_text(separator='|', strip=True)
                        parts = [p.strip() for p in meta_text.split('|')]
                        # The date is usually the second part.
                        if len(parts) > 1:
                            # Find the part that can be parsed as a date
                            for part in parts:
                                try:
                                    datetime.strptime(part, '%b %d, %Y')
                                    date_str = part
                                    break
                                except ValueError:
                                    continue

                    startDate = None
                    if date_str:
                        try:
                            # Check if date is in the future
                            event_date = datetime.strptime(date_str, '%b %d, %Y')
                            if event_date < datetime.now():
                                continue
                            startDate = event_date.isoformat()
                        except ValueError:
                            logger.warning(f"Could not parse date '{date_str}' for event: {name}")
                            continue

                    description_tag = container.select_one('div.fusion-post-content-container p')
                    short_description = description_tag.get_text(strip=True) if description_tag else ""
                    
                    full_description = self.get_event_description(url)

                    event_id = hashlib.md5(url.encode()).hexdigest()
                    
                    base_categories = ['Webinar', 'Legal', 'Professional Development']
                    categories = EventCategorizer.categorize_event(name, full_description, base_categories)
                    event_type = "Webinar"

                    event = Event(
                        id=f"barkergilmore_{event_id}",
                        name=name,
                        description=full_description,
                        communityId=self.community_id,
                        startDate=startDate,
                        endDate=startDate, 
                        url=url,
                        event_type=event_type,
                        category=categories,
                        metadata={'source': 'BarkerGilmore Webinars', 'short_description': short_description}
                    )
                    events.append(event)
                except Exception as e:
                    logger.error(f"Error parsing event container for {url}: {e}")
                    continue
        except Exception as e:
            logger.error(f"Error fetching or parsing BarkerGilmore webinars page: {e}")

        logger.info(f"Found {len(events)} events for BarkerGilmore.")
        return events

    def get_event_description(self, event_url: str) -> str:
        """Fetches the event's page and extracts the full description."""
        try:
            response = self.session.get(event_url, timeout=30)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            content_area = soup.select_one('div.post-content')
            if content_area:
                return content_area.get_text(separator=' ', strip=True)
            return ""
        except Exception as e:
            logger.error(f"Failed to fetch description from {event_url}: {e}")
            return ""

def main():
    """Main function to run the scraper for testing purposes."""
    logging.basicConfig(level=logging.INFO)
    scraper = BarkerGilmoreScraper()
    events = scraper.get_events()
    if events:
        for event in events:
            print(json.dumps(event.to_dict(), indent=2))
    else:
        print("No events found.")

if __name__ == "__main__":
    main() 