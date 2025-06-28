#!/usr/bin/env python3
"""
Scraper for Cardozo Law School events: 
https://cardozo.yu.edu/events?field_end_date_value=1&field_event_audience_tag_value=2&tid=All&select_type_option=All
"""

import logging
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from typing import List, Optional
import hashlib
import re

try:
    from .base_scraper import BaseScraper
    from .models import Event
except ImportError:
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from base_scraper import BaseScraper
    from models import Event

logger = logging.getLogger(__name__)

class CardozoLawScraper(BaseScraper):
    """Scraper for Cardozo Law School events."""
    
    def __init__(self, community_id: str = "com_cardozo"):
        super().__init__(community_id)
        # Try the main events page first, then filtered version
        self.urls = [
            "https://cardozo.yu.edu/events",
            "https://cardozo.yu.edu/events?field_end_date_value=1&field_event_audience_tag_value=2&tid=All&select_type_option=All"
        ]
        self.base_url = "https://cardozo.yu.edu"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        }

    def get_events(self) -> List[Event]:
        """Fetch and parse events from Cardozo Law School website."""
        all_events = []
        
        for url in self.urls:
            logger.info(f"Fetching events from {url}")
            try:
                response = requests.get(url, headers=self.headers)
                response.raise_for_status()
                
                # Save debug file for the first URL
                if url == self.urls[0]:
                    with open("cardozo_debug.html", "w", encoding="utf-8") as f:
                        f.write(response.text)
                
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Look for event containers - common patterns for Drupal-based sites like Cardozo
                event_containers = soup.select('.view-content .views-row, .event-item, .node-event, .event-listing, article')
                
                logger.info(f"Found {len(event_containers)} potential event containers on {url}")
                
                page_events = []
                for container in event_containers:
                    try:
                        event = self._parse_event(container)
                        if event:
                            page_events.append(event)
                            logger.info(f"Successfully parsed event: {event.name}")
                    except Exception as e:
                        logger.warning(f"Failed to parse event container: {e}")
                        continue
                
                all_events.extend(page_events)
                
                # If we found good events on the first URL, use those
                if page_events and any('bar study rooms' not in event.name.lower() for event in page_events):
                    logger.info(f"Found {len(page_events)} good events on {url}, stopping search")
                    break
                    
            except requests.RequestException as e:
                logger.error(f"Error fetching page {url}: {e}")
                continue
        
        # Remove duplicates based on name and date
        unique_events = []
        seen = set()
        for event in all_events:
            key = (event.name.lower(), event.startDate[:10])  # name + date
            if key not in seen:
                seen.add(key)
                unique_events.append(event)
        
        logger.info(f"Successfully scraped {len(unique_events)} unique events from Cardozo Law")
        return unique_events
    
    def _parse_event(self, container) -> Optional[Event]:
        """Parse an individual event from a container element."""
        
        # Try to find the event title
        title_selectors = [
            'h3 a', 'h2 a', '.title a', '.event-title a', 
            'h3', 'h2', '.title', '.event-title',
            '.field-content a', '.node-title a'
        ]
        
        name = None
        url = None
        
        for selector in title_selectors:
            title_element = container.select_one(selector)
            if title_element:
                name = title_element.get_text(strip=True)
                if title_element.name == 'a' and title_element.get('href'):
                    href = title_element.get('href')
                    url = href if href.startswith('http') else self.base_url + href
                break
        
        if not name:
            return None
        
        # Filter out non-event entries
        excluded_terms = [
            'bar study rooms', 'study room', 'room reservation', 
            'room booking', 'library hours', 'dining hours',
            'campus hours', 'facility hours'
        ]
        
        if any(term in name.lower() for term in excluded_terms):
            return None
        
        # Try to find date information
        date_selectors = [
            '.date', '.event-date', '.field-date', '.datetime',
            '.views-field-field-date', '.field-name-field-date'
        ]
        
        date_text = ""
        for selector in date_selectors:
            date_element = container.select_one(selector)
            if date_element:
                date_text = date_element.get_text(strip=True)
                break
        
        # Parse the date
        start_datetime = self._parse_date(date_text)
        start_date_iso = start_datetime.isoformat() if start_datetime else datetime.now().isoformat()
        
        # Try to find description
        desc_selectors = [
            '.field-body', '.description', '.event-description', 
            '.views-field-body', '.field-content p'
        ]
        
        description = ""
        for selector in desc_selectors:
            desc_element = container.select_one(selector)
            if desc_element:
                description = desc_element.get_text(strip=True)
                break
        
        if not description:
            description = f"Cardozo Law School event: {name}"
        
        # Generate unique ID
        id_source = url if url else f"{name}-{date_text}"
        event_id = f"cardozo-{hashlib.sha256(id_source.encode('utf-8')).hexdigest()[:10]}"
        
        return Event(
            id=event_id,
            name=name,
            description=description,
            url=url,
            startDate=start_date_iso,
            communityId=self.community_id,
            metadata={'raw_date': date_text}
        )
    
    def _parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse date string into datetime object."""
        if not date_str:
            return None
            
        try:
            # Common date patterns
            patterns = [
                r'(\w+\s+\d{1,2},\s+\d{4})',  # "January 15, 2025"
                r'(\d{1,2}/\d{1,2}/\d{4})',   # "01/15/2025"
                r'(\d{4}-\d{2}-\d{2})',       # "2025-01-15"
            ]
            
            for pattern in patterns:
                match = re.search(pattern, date_str)
                if match:
                    date_part = match.group(1)
                    formats = ['%B %d, %Y', '%m/%d/%Y', '%Y-%m-%d']
                    
                    for fmt in formats:
                        try:
                            return datetime.strptime(date_part, fmt)
                        except ValueError:
                            continue
                            
        except Exception as e:
            logger.error(f"Error parsing date '{date_str}': {e}")
            
        return None

def main():
    """Main function to run the scraper for testing."""
    scraper = CardozoLawScraper()
    events = scraper.get_events()
    logger.info(f"Scraped {len(events)} events.")
    for event in events:
        print(event.to_dict())

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    main() 