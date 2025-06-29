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
            
            # Save debug file
            with open("lsuite_events_debug.html", "w", encoding="utf-8") as f:
                f.write(response.text)
            
            # Look for the correct selector based on the HTML structure
            event_articles = soup.select('article.event-tease')
            logger.info(f"Found {len(event_articles)} event articles.")

            for article in event_articles:
                try:
                    # Extract event name from header
                    header = article.select_one('header.event-tease__info')
                    if not header:
                        continue
                        
                    # Get the title - look for h3 specifically and extract only visible text
                    name_tag = header.select_one('h3')
                    if not name_tag:
                        logger.warning("Could not find h3 tag in article header")
                        continue
                    
                    # Remove screen reader only text and get the visible text
                    # The structure is: <h3><a><span class="sr-only">...</span></a>Visible Text</h3>
                    sr_only = name_tag.select_one('.sr-only')
                    if sr_only:
                        sr_only.decompose()  # Remove the sr-only span
                    
                    name = name_tag.get_text(strip=True)
                    
                    # Try to find URL - look for links in the article
                    url_link = article.select_one('a[href]')
                    url = None
                    if url_link:
                        url = url_link.get('href')
                    if url and not url.startswith('http'):
                        url = f"https://www.lsuite.co{url}"

                    # Get date information
                    details_tag = article.select_one('p.event-tease__details')
                    date_str = ""
                    if details_tag:
                        date_str = details_tag.get_text(strip=True)
                    
                    # Parse date - L Suite typically uses formats like "January 15, 2025"
                    start_datetime = self.parse_date(date_str)
                    if not start_datetime:
                        logger.warning(f"Could not parse date '{date_str}' for event: {name}")
                        # Use current date as fallback
                        start_datetime = datetime.now()
                    
                    start_date_iso = start_datetime.isoformat()

                    # Get description
                    description = ""
                    desc_tags = article.select('p, div')
                    for tag in desc_tags:
                        if tag.get_text(strip=True) and 'event-tease__details' not in tag.get('class', []):
                            description = tag.get_text(strip=True)
                            break
                    
                    if not description:
                        description = f"The L Suite event: {name}"
                
                    # Generate unique ID
                    id_source = url if url else f"{name}-{date_str}"
                    event_id = f"lsuite-{hashlib.sha256(id_source.encode('utf-8')).hexdigest()[:10]}"

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
                    logger.info(f"Successfully parsed event: {name}")
                    
                except Exception as e:
                    logger.error(f"Error parsing an event article: {e}")

        except requests.RequestException as e:
            logger.error(f"Error fetching page {self.url}: {e}")

        logger.info(f"Successfully scraped {len(events)} events from L Suite")
        return events
    
    def parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse date string into datetime object."""
        if not date_str:
            return None
            
        try:
            # L Suite date format examples:
            # "Jul 10, 2025 6:00pm EDT"
            # "Jul 15, 2025 12:00pm EDT"
            # "Jul 16, 2025 5:30pm PDT"
            
            # Extract date and time parts
            # Pattern: "Jul 10, 2025 6:00pm EDT"
            match = re.search(r'(\w{3}\s+\d{1,2},\s+\d{4})\s+(\d{1,2}:\d{2})(am|pm)\s+([A-Z]{3,4})', date_str)
            if match:
                date_part = match.group(1)  # "Jul 10, 2025"
                time_part = match.group(2)  # "6:00"
                ampm = match.group(3)       # "pm"
                timezone = match.group(4)   # "EDT"
                
                # Parse the date
                try:
                    # Convert abbreviated month to full format that strptime can handle
                    date_obj = datetime.strptime(date_part, '%b %d, %Y')
                    
                    # Parse the time
                    time_obj = datetime.strptime(f"{time_part}{ampm}", '%I:%M%p').time()
                    
                    # Combine date and time
                    combined_datetime = datetime.combine(date_obj.date(), time_obj)
                    
                    return combined_datetime
                    
                except ValueError as e:
                    logger.warning(f"Failed to parse datetime components from '{date_str}': {e}")
            
            # Fallback patterns for different formats
            fallback_patterns = [
                (r'(\w+\s+\d{1,2},\s+\d{4})', '%B %d, %Y'),  # "January 15, 2025"
                (r'(\d{1,2}/\d{1,2}/\d{4})', '%m/%d/%Y'),     # "01/15/2025"
                (r'(\d{4}-\d{2}-\d{2})', '%Y-%m-%d'),         # "2025-01-15"
            ]
            
            for pattern, fmt in fallback_patterns:
                match = re.search(pattern, date_str)
                if match:
                    date_part = match.group(1)
                    try:
                        return datetime.strptime(date_part, fmt)
                    except ValueError:
                        continue
                        
        except Exception as e:
            logger.error(f"Error parsing date '{date_str}': {e}")
            
        return None

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