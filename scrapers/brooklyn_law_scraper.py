#!/usr/bin/env python3
"""
Scraper for Brooklyn Law School events: https://www.brooklaw.edu/news-and-events/events/
"""

import logging
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from typing import List, Optional
import hashlib
import re

from .base_scraper import BaseScraper
from .models import Event

logger = logging.getLogger(__name__)

class BrooklynLawScraper(BaseScraper):
    """Scraper for Brooklyn Law School events."""
    
    def __init__(self, community_id: str = "com_brooklyn_law"):
        super().__init__(community_id)
        self.url = "https://www.brooklaw.edu/news-and-events/events/"
        self.base_url = "https://www.brooklaw.edu"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        }

    def get_events(self) -> List[Event]:
        """Fetch and parse events from Brooklyn Law School website."""
        logger.info(f"Fetching events from {self.url}")
        events = []
        
        try:
            response = requests.get(self.url, headers=self.headers)
            response.raise_for_status()
            
            # Save debug file
            with open("brooklyn_law_debug.html", "w", encoding="utf-8") as f:
                f.write(response.text)
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Look for event containers - typical patterns for law school sites
            event_containers = soup.select('.event-item, .event, .listing-item, .card, article, .post, .news-item, .event-card')
            
            logger.info(f"Found {len(event_containers)} potential event containers")
            
            for container in event_containers:
                try:
                    event = self._parse_event(container)
                    if event:
                        events.append(event)
                        logger.info(f"Successfully parsed event: {event.name}")
                except Exception as e:
                    logger.warning(f"Failed to parse event container: {e}")
                    continue
            
        except requests.RequestException as e:
            logger.error(f"Error fetching page {self.url}: {e}")
        
        logger.info(f"Successfully scraped {len(events)} events from Brooklyn Law")
        return events
    
    def _parse_event(self, container) -> Optional[Event]:
        """Parse an individual event from a container element."""
        
        # Try to find the event title
        title_selectors = [
            'h3 a', 'h2 a', 'h1 a', '.title a', '.event-title a', 
            'h3', 'h2', 'h1', '.title', '.event-title',
            '.entry-title a', '.card-title a', '.headline a'
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
        
        # Try to find date information
        date_selectors = [
            '.date', '.event-date', '.post-date', '.entry-date',
            'time', '.datetime', '.event-time', '.event-meta',
            '.card-date', '.meta-date'
        ]
        
        date_text = ""
        for selector in date_selectors:
            date_element = container.select_one(selector)
            if date_element:
                date_text = date_element.get_text(strip=True)
                # Also check for datetime attribute
                if date_element.get('datetime'):
                    date_text = date_element.get('datetime')
                break
        
        # Parse the date
        start_datetime = self._parse_date(date_text)
        start_date_iso = start_datetime.isoformat() if start_datetime else datetime.now().isoformat()
        
        # Try to find description
        desc_selectors = [
            '.description', '.excerpt', '.event-description', 
            '.entry-content', '.card-text', '.summary', 'p'
        ]
        
        description = ""
        for selector in desc_selectors:
            desc_element = container.select_one(selector)
            if desc_element:
                description = desc_element.get_text(strip=True)
                break
        
        if not description:
            description = f"Brooklyn Law School event: {name}"
        
        # Generate unique ID
        id_source = url if url else f"{name}-{date_text}"
        event_id = f"brooklyn-law-{hashlib.sha256(id_source.encode('utf-8')).hexdigest()[:10]}"
        
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
            # Handle ISO format first
            if 'T' in date_str and ('Z' in date_str or '+' in date_str):
                return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            
            # Common date patterns
            patterns = [
                r'(\w+\s+\d{1,2},\s+\d{4})',  # "January 15, 2025"
                r'(\d{1,2}/\d{1,2}/\d{4})',   # "01/15/2025"
                r'(\d{4}-\d{2}-\d{2})',       # "2025-01-15"
                r'(\w+\s+\d{1,2})',           # "January 15" (current year)
            ]
            
            for pattern in patterns:
                match = re.search(pattern, date_str)
                if match:
                    date_part = match.group(1)
                    formats = ['%B %d, %Y', '%m/%d/%Y', '%Y-%m-%d', '%B %d']
                    
                    for fmt in formats:
                        try:
                            parsed = datetime.strptime(date_part, fmt)
                            # If no year specified, use current year
                            if fmt == '%B %d':
                                parsed = parsed.replace(year=datetime.now().year)
                            return parsed
                        except ValueError:
                            continue
                            
        except Exception as e:
            logger.error(f"Error parsing date '{date_str}': {e}")
            
        return None

def main():
    """Main function to run the scraper for testing."""
    scraper = BrooklynLawScraper()
    events = scraper.get_events()
    logger.info(f"Scraped {len(events)} events.")
    for event in events:
        print(event.to_dict())

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    main() 