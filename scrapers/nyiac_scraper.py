import requests
from bs4 import BeautifulSoup
from datetime import datetime
import re
from typing import List, Optional
from .base_scraper import BaseScraper
from .models import Event
import os
from .categorization_helper import EventCategorizer
import logging
import json

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
logger = logging.getLogger(__name__)

class NYIACScraper(BaseScraper):
    """Scraper for NYIAC events."""
    
    def __init__(self, community_id: str):
        super().__init__(community_id)
        self.base_url = "https://nyiac.org"
        self.events_url = f"{self.base_url}/events/category/new-york/"
    
    def get_events(self) -> List[Event]:
        """Get events from the NYIAC website."""
        try:
            response = self.session.get(self.events_url)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            events = []
            seen_titles = set()  # Track seen titles to avoid duplicates
            
            # Look for events in the current structure
            # The event appears to be in a list format
            event_containers = soup.find_all(['article', 'div'], class_=lambda x: x and ('event' in x.lower() or 'post' in x.lower()))
            
            # If no specific event containers found, look for any content that might contain events
            if not event_containers:
                # Look for the specific event mentioned on the page
                event_text = soup.find(text=re.compile(r'ICC New York Conference on International Arbitration', re.IGNORECASE))
                if event_text:
                    # Find the parent container
                    event_container = event_text.find_parent(['div', 'article', 'section'])
                    if event_container:
                        event_containers = [event_container]
            
            # Also look for any date/time patterns that might indicate events
            date_patterns = soup.find_all(text=re.compile(r'September \d+.*@.*\d+:\d+', re.IGNORECASE))
            for date_text in date_patterns:
                parent = date_text.find_parent(['div', 'article', 'section'])
                if parent and parent not in event_containers:
                    event_containers.append(parent)
            
            print(f"Found {len(event_containers)} potential event containers")
            
            for container in event_containers:
                try:
                    # Extract event details from the container
                    title = self._extract_title(container)
                    if not title:
                        continue
                    
                    # Only keep events with meaningful titles
                    event_keywords = ['conference', 'arbitration', 'meeting', 'seminar', 'workshop', 'panel', 'forum', 'summit']
                    if (
                        len(title) < 10
                        or all(kw not in title.lower() for kw in event_keywords)
                    ):
                        continue
                    
                    # Skip if we've already seen this title
                    if title in seen_titles:
                        continue
                    
                    # Extract date and time
                    date_info = self._extract_date_time(container)
                    if not date_info:
                        continue
                    
                    start_date, end_date = date_info
                    
                    # Extract description
                    description = self._extract_description(container)
                    
                    # Extract location
                    location = self._extract_location(container)
                    
                    # Create event ID
                    event_id = f"nyiac_{start_date.strftime('%Y%m%d_%H%M')}"
                    
                    # Use centralized categorization
                    base_categories = ['Arbitration', 'Legal Events', 'International Law']
                    categories = EventCategorizer.categorize_event(title, description, base_categories)
                    
                    # Create event object
                    event = Event(
                        id=event_id,
                        name=title,
                        description=description,
                        startDate=start_date.isoformat(),
                        endDate=end_date.isoformat() if end_date else None,
                        communityId=self.community_id,
                        image=None,
                        price=None,
                        metadata={
                            "source_url": self.events_url,
                            "venue": {
                                "name": location,
                                "type": "in-person" if location else "virtual"
                            }
                        },
                        category=categories,
                        tags=None,
                        event_type="Conference"
                    )
                    
                    events.append(event)
                    seen_titles.add(title)  # Mark this title as seen
                    print(f"Successfully created event: {title}")
                    
                except Exception as e:
                    print(f"Error processing event container: {e}")
                    continue
            
            return events
            
        except Exception as e:
            print(f"Error fetching events from NYIAC: {e}")
            return []
    
    def _extract_title(self, container) -> Optional[str]:
        """Extract event title from container."""
        # Look for various title patterns
        title_selectors = [
            'h1', 'h2', 'h3', 'h4',
            '.event-title', '.post-title', '.title',
            '[class*="title"]', '[class*="event"]'
        ]
        
        for selector in title_selectors:
            title_elem = container.find(selector)
            if title_elem:
                title = title_elem.get_text(strip=True)
                if title and len(title) > 5:  # Basic validation
                    return title
        
        # If no title found, look for any text that might be a title
        text_content = container.get_text()
        lines = [line.strip() for line in text_content.split('\n') if line.strip()]
        for line in lines:
            if len(line) > 10 and any(keyword in line.lower() for keyword in ['conference', 'arbitration', 'event', 'meeting']):
                return line
        
        return None
    
    def _extract_date_time(self, container) -> Optional[tuple]:
        """Extract date and time from container."""
        text_content = container.get_text()
        
        # Look for date patterns like "September 18 @ 9:00 am - September 19 @ 6:00 pm"
        date_patterns = [
            r'(\w+ \d+)\s*@\s*(\d+:\d+\s*[ap]m)\s*-\s*(\w+ \d+)\s*@\s*(\d+:\d+\s*[ap]m)',
            r'(\w+ \d+)\s*@\s*(\d+:\d+\s*[ap]m)',
            r'(\w+ \d+,\s*\d{4})\s*@\s*(\d+:\d+\s*[ap]m)',
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text_content, re.IGNORECASE)
            if match:
                try:
                    if len(match.groups()) == 4:  # Two-day event
                        start_date_str = f"{match.group(1)} {match.group(2)}"
                        end_date_str = f"{match.group(3)} {match.group(4)}"
                        
                        start_date = datetime.strptime(start_date_str, '%B %d %I:%M %p')
                        end_date = datetime.strptime(end_date_str, '%B %d %I:%M %p')
                        
                        # Set year to 2025 (current year)
                        start_date = start_date.replace(year=2025)
                        end_date = end_date.replace(year=2025)
                        
                        return start_date, end_date
                    else:  # Single day event
                        date_str = f"{match.group(1)} {match.group(2)}"
                        start_date = datetime.strptime(date_str, '%B %d %I:%M %p')
                        start_date = start_date.replace(year=2025)
                        return start_date, None
                except ValueError:
                    continue
        
        return None
    
    def _extract_description(self, container) -> Optional[str]:
        """Extract event description from container."""
        # Look for description in various elements
        desc_selectors = [
            'p', '.description', '.event-description', '.content',
            '[class*="description"]', '[class*="content"]'
        ]
        
        for selector in desc_selectors:
            desc_elem = container.find(selector)
            if desc_elem:
                desc = desc_elem.get_text(strip=True)
                if desc and len(desc) > 20:
                    return desc
        
        return None
    
    def _extract_location(self, container) -> Optional[str]:
        """Extract event location from container."""
        text_content = container.get_text()
        
        # Look for location patterns
        location_patterns = [
            r'(TBD|New York|NYC|Manhattan|Brooklyn|Queens|Bronx|Staten Island)',
            r'([^,]+,\s*New York,\s*NY)',
        ]
        
        for pattern in location_patterns:
            match = re.search(pattern, text_content, re.IGNORECASE)
            if match:
                return match.group(1)
        
        return None

def main():
    """Main function to run the scraper."""
    logging.basicConfig(level=logging.INFO)
    scraper = NYIACScraper(community_id="com_nyiac")
    events = scraper.get_events()
    print(json.dumps([event.to_dict() for event in events], indent=2))

if __name__ == "__main__":
    main()
