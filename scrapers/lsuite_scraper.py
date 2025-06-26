#!/usr/bin/env python3
"""
Scraper for The L Suite events: https://www.lsuite.co/events
"""

import requests
from bs4 import BeautifulSoup
import logging
import re
from datetime import datetime
from typing import List, Optional
import hashlib

from .base_scraper import BaseScraper
from .models import Event

logger = logging.getLogger(__name__)

class LSuiteScraper(BaseScraper):
    """Scraper for The L Suite events."""
    
    def __init__(self, community_id: str = "com_lsuite"):
        super().__init__(community_id)
        self.url = "https://www.lsuite.co/events"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        }

    def get_events(self) -> List[Event]:
        """Fetch and parse events from The L Suite website."""
        logger.info(f"Fetching events from {self.url}")
        events = []
        
        try:
            response = requests.get(self.url, headers=self.headers)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html5lib')
            
            event_cards = soup.select('a.event-card')
            logger.info(f"Found {len(event_cards)} event cards.")

            for card in event_cards:
                try:
                    name_tag = card.select_one('h4')
                    name = name_tag.get_text(strip=True) if name_tag else "No Title"

                    url = card.get('href')
                    if url and not url.startswith('http'):
                        url = f"https://www.lsuite.co{url}"

                    date_tag = card.select_one('p.event-card__date')
                    date_str = date_tag.get_text(strip=True) if date_tag else ""
                    
                    # Assuming date is in a format like "Month Day, Year"
                    # We will need a robust date parsing method. For now, let's just extract it.
                    # A proper implementation will require parsing 'date_str' into a datetime object.
                    
                    description_tag = card.select_one('p:not(.event-card__date)')
                    description = description_tag.get_text(strip=True) if description_tag else "No description."
                
                    # ID generation
                    event_id = f"lsuite-{hashlib.sha256(url.encode('utf-8')).hexdigest()[:10]}"

                    # Placeholder for start/end dates until parsing is implemented
                    start_date_iso = "NEEDS_PARSING"

                    event = Event(
                        id=event_id,
                        name=name,
                        description=description,
                        url=url,
                        startDate=start_date_iso,
                        communityId=self.community_id,
                        metadata={'raw_date': date_str}
                    )
                    events.append(event)
                except Exception as e:
                    logger.error(f"Error parsing an event card: {e}")

        except requests.RequestException as e:
            logger.error(f"Error fetching page {self.url}: {e}")

        return events

def main():
    """Main function to run the scraper for testing."""
    scraper = LSuiteScraper()
    events = scraper.get_events()
    logger.info(f"Scraped {len(events)} events.")
    for event in events:
        print(event.to_dict())

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    main() 