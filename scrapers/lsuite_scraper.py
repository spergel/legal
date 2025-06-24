import requests
from bs4 import BeautifulSoup
import logging
import re
from datetime import datetime
from typing import List, Optional
import hashlib

from .base_scraper import BaseScraper
from .models import Event

class LSuiteScraper(BaseScraper):
    def __init__(self, community_id: str = "com_lsuite"):
        super().__init__(community_id)
        self.url = "https://www.lsuite.co/events"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36'
        }

    def get_events(self) -> List[Event]:
        events = []
        try:
            response = requests.get(self.url, headers=self.headers)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')

            with open("lsuite_events_debug.html", "w", encoding="utf-8") as f:
                f.write(str(soup.prettify()))

            for card in soup.select('a.event-card'):
                try:
                    name_tag = card.select_one('h3')
                    name = name_tag.get_text(strip=True) if name_tag else "No name found"
                    
                    url = "https://www.lsuite.co" + card['href']

                    date_tag = card.select_one('time')
                    date_str = date_tag['datetime'] if date_tag else None
                    
                    start_datetime_obj = datetime.fromisoformat(date_str) if date_str else None

                    location_tag = card.select_one('.text-grey-700')
                    location = location_tag.get_text(strip=True) if location_tag else "Virtual"
                    
                    if not name or not start_datetime_obj:
                        continue

                    hash_input = f"{name}-{start_datetime_obj}"
                    event_id = f"lsuite-{hashlib.md5(hash_input.encode('utf-8')).hexdigest()}"

                    event = Event(
                        id=event_id,
                        name=name,
                        startDate=start_datetime_obj.isoformat(),
                        url=url,
                        communityId=self.community_id,
                        locationId=location,
                        description=f"Event at {location}",
                    )
                    events.append(event)
                except Exception as e:
                    logging.error(f"Error parsing L Suite event card: {e}")
                    continue
        
        except requests.exceptions.RequestException as e:
            logging.error(f"Error fetching L Suite page: {e}")
        except Exception as e:
            logging.error(f"An error occurred in L Suite scraper: {e}")
            
        return events

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    scraper = LSuiteScraper()
    scraped_events = scraper.get_events()
    print(f"Scraped {len(scraped_events)} events from L Suite.")
    for event in scraped_events:
        print(event.to_dict()) 