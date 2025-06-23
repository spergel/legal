import os
import requests
from bs4 import BeautifulSoup
from typing import List
from datetime import datetime
import hashlib
import sys
import re

# Adjust path to import from parent directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))
sys.path.append(PROJECT_ROOT)

from scrapers.base_scraper import BaseScraper
from scrapers.models import Event

class BarkerGilmoreScraper(BaseScraper):
    def __init__(self, community_id: str):
        super().__init__(community_id)
        self.base_url = "https://barkergilmore.com"
        self.events_url = f"{self.base_url}/content_type/webinar/"

    def get_events(self) -> List[Event]:
        events = []
        try:
            response = requests.get(self.events_url, timeout=20)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching {self.events_url}: {e}")
            return events

        soup = BeautifulSoup(response.text, 'html.parser')
        
        # This selector is a guess based on common WordPress/FusionBuilder theme structures.
        event_containers = soup.find_all('article', class_=re.compile(r'post-\d+'))

        for container in event_containers:
            try:
                title_tag = container.find('h2', class_='blog-shortcode-post-title')
                if not title_tag or not title_tag.find('a'):
                    continue
                
                title_link = title_tag.find('a')
                name = title_link.get_text(strip=True)
                url = title_link['href']

                # The description snippet is in the main listing
                description_tag = container.find('div', class_='fusion-post-content-container')
                description = ""
                if description_tag and description_tag.find('p'):
                    description = description_tag.find('p').get_text(strip=True)

                # Date parsing from metadata
                date_str = ""
                date_tag = container.find('span', class_='fusion-meta-tb-date')
                start_date = None
                if date_tag:
                    date_str = date_tag.get_text(strip=True)
                    # The date string is ISO 8601 format like '2025-06-20T07:32:26-04:00'
                    try:
                        start_date = datetime.fromisoformat(date_str)
                    except ValueError:
                        print(f"Could not parse date: {date_str}")
                        continue
                else:
                    # If we can't find a proper date tag, skip this event
                    continue

                # Generate a unique ID
                hash_input = f"{name}-{url}"
                event_id = hashlib.sha256(hash_input.encode('utf-8')).hexdigest()

                event = Event(
                    id=event_id,
                    name=name,
                    description=description,
                    url=url,
                    startDate=start_date.isoformat() if start_date else "",
                    communityId=self.community_id,
                    tags=['Webinar']
                )
                events.append(event)
            except Exception as e:
                print(f"Error parsing an event container on BarkerGilmore: {e}")
                continue
                
        print(f"Found {len(events)} events for BarkerGilmore.")
        return events 