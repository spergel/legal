#!/usr/bin/env python3
"""
ChIPs Network Events Scraper

This scraper fetches events from ChIPs Network using their JSON API endpoint to fetch events data.

ChIPs is a nonprofit organization focused on advancing and connecting women in technology, law, and policy.
"""

import logging
import requests
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from bs4 import BeautifulSoup
import re
import hashlib
import json

from .base_scraper import BaseScraper
from .models import Event
from .categorization_helper import EventCategorizer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ChIPsNetworkScraper(BaseScraper):
    """Scraper for ChIPs Network events from their JSON API."""
    
    def __init__(self, community_id="com_chips_network"):
        super().__init__(community_id=community_id)
        self.api_url = "https://network.chipsnetwork.org/events.json"
        self.base_url = "https://network.chipsnetwork.org"
        
    def get_events(self) -> List[Event]:
        """Fetch and parse events from ChIPs Network API."""
        logger.info(f"Fetching events from ChIPs Network API: {self.api_url}")
        
        try:
            # Set up headers to mimic the browser request
            headers = {
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15',
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': 'https://network.chipsnetwork.org/events?tag=thisWeek'
            }
            
            # Parameters for the API request
            params = {
                'include_network_events': 'true',
                'query[order]': 'asc',
                'query[with_location]': '',
                'query[gte_start_date]': '',
                'query[active_during_next_x_days]': '30',  # Get events for next 30 days
                'page': '1',
                'per_page': '50'  # Get more events per page
            }
            
            # Fetch the events data
            response = self.session.get(
                self.api_url, 
                params=params, 
                headers=headers, 
                timeout=30
            )
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"Successfully fetched {data.get('total_items', 0)} total events from ChIPs Network")
            
            events = []
            for event_data in data.get('events', []):
                try:
                    event = self._parse_event(event_data)
                    if event:
                        events.append(event)
                except Exception as e:
                    logger.warning(f"Failed to parse event '{event_data.get('title', 'Unknown')}': {e}")
                    continue
            
            logger.info(f"Successfully parsed {len(events)} events from ChIPs Network")
            return events
            
        except requests.RequestException as e:
            logger.error(f"Failed to fetch events from ChIPs Network API: {e}")
            return []
        except Exception as e:
            logger.error(f"Failed to parse ChIPs Network events: {e}")
            return []
    
    def _parse_event(self, event_data: Dict[str, Any]) -> Optional[Event]:
        """Parse an individual event from the API response."""
        try:
            # Generate a unique ID based on event ID and title
            event_id = self._generate_event_id(event_data.get('id'), event_data.get('title'))
            
            # Extract basic event information
            title = event_data.get('title', '')
            start_date = event_data.get('start_date')
            end_date = event_data.get('end_date')
            timezone_str = event_data.get('timezone', 'UTC')
            
            # Parse dates
            start_datetime = self._parse_datetime(start_date, timezone_str) if start_date else None
            end_datetime = self._parse_datetime(end_date, timezone_str) if end_date else None
            
            # Extract additional information
            webinar_url = event_data.get('webinar_url', '')
            participation_type = event_data.get('participation_type', '')
            cancelled = event_data.get('cancelled', False)
            
            # Skip cancelled events
            if cancelled:
                logger.info(f"Skipping cancelled event: {title}")
                return None
            
            # Extract organizer information
            organizer = event_data.get('organizer', {})
            organizer_name = organizer.get('name', 'ChIPs Network')
            
            # Extract categories from network_categories
            categories = []
            network_categories = event_data.get('network_categories', [])
            for category in network_categories:
                categories.append(category.get('name', '').strip())
            
            # Use centralized categorization
            base_categories = ['Professional Organization', 'Legal Events', 'Technology']
            if categories:
                base_categories.extend(categories)
            description = self._create_description(event_data)
            event_categories = EventCategorizer.categorize_event(title, description, base_categories)
            
            # Extract image information
            image_url = None
            if event_data.get('new_cover_picture'):
                cover_picture = event_data['new_cover_picture']
                image_url = cover_picture.get('preview_url') or cover_picture.get('original_url')
            
            # Determine event type based on title and categories
            event_type = self._determine_event_type(title, event_categories, participation_type)
            
            # Extract CLE credits from title or description
            cle_credits = self._extract_cle_credits(title)
            
            # Create description from available data
            description = self._create_description(event_data)
            
            # Create metadata
            metadata = {
                "source": "ChIPs Network",
                "api_url": self.api_url,
                "organizer": organizer_name,
                "participation_type": participation_type,
                "webinar_url": webinar_url,
                "timezone": timezone_str,
                "display_price_tag": event_data.get('display_price_tag', False),
                "show_webinar_url": event_data.get('show_webinar_url', False),
                "is_internal_zoom_meeting": event_data.get('is_internal_zoom_meeting', False),
                "raw_event_data": {
                    "id": event_data.get('id'),
                    "type": event_data.get('type'),
                    "created_at": event_data.get('created_at'),
                    "updated_at": event_data.get('updated_at'),
                    "published_at": event_data.get('published_at'),
                    "linked_topic_ids": event_data.get('linked_topic_ids', []),
                    "has_attendees": event_data.get('has_attendees', False)
                }
            }
            
            # Skip events without valid dates
            if not start_datetime:
                logger.warning(f"Skipping CHiPs Network event '{title}' - no valid date found")
                return None
            
            # Create the Event object
            event = Event(
                id=event_id,
                name=title,
                description=description,
                startDate=start_datetime.isoformat(),
                endDate=end_datetime.isoformat() if end_datetime else None,
                communityId=self.community_id,
                image=image_url,
                event_type=event_type,
                cle_credits=cle_credits,
                category=event_categories if event_categories else None,
                metadata=metadata
            )
            
            return event
            
        except Exception as e:
            logger.error(f"Error parsing ChIPs event '{event_data.get('title', 'Unknown')}': {e}")
            return None
    
    def _generate_event_id(self, event_id: Optional[int], title: str) -> str:
        """Generate a unique event ID based on event ID and title."""
        if event_id:
            return f"chips_{event_id}"
        else:
            # Fallback to title-based hash
            content = f"chips_{title}"
            return f"chips_{hashlib.md5(content.encode()).hexdigest()[:12]}"
    
    def _parse_datetime(self, date_str: str, timezone_str: str) -> Optional[datetime]:
        """Parse datetime string with timezone information."""
        try:
            # The API returns ISO format with timezone offset
            dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return dt
        except Exception as e:
            logger.warning(f"Failed to parse datetime '{date_str}': {e}")
            return None
    
    def _determine_event_type(self, title: str, categories: List[str], participation_type: str) -> Optional[str]:
        """Determine the type of event based on title, categories, and participation type."""
        text = f"{title} {' '.join(categories)} {participation_type}".lower()
        
        if any(word in text for word in ['webinar', 'virtual', 'zoom']):
            return 'Webinar'
        elif any(word in text for word in ['dinner', 'lunch', 'reception', 'mixer']):
            return 'Networking'
        elif any(word in text for word in ['conference', 'summit', 'symposium']):
            return 'Conference'
        elif any(word in text for word in ['workshop', 'training', 'seminar']):
            return 'Workshop'
        elif any(word in text for word in ['panel', 'discussion', 'talk']):
            return 'Panel Discussion'
        elif any(word in text for word in ['check-in', 'meeting']):
            return 'Meeting'
        else:
            return 'Event'
    
    def _extract_cle_credits(self, title: str) -> Optional[float]:
        """Extract CLE credits from event title."""
        if not title:
            return None
        
        # Look for CLE credit patterns
        cle_patterns = [
            r'(\d+(?:\.\d+)?)\s*CLE\s*credit',
            r'(\d+(?:\.\d+)?)\s*credit',
            r'CLE:\s*(\d+(?:\.\d+)?)',
            r'(\d+(?:\.\d+)?)\s*hour',
        ]
        
        for pattern in cle_patterns:
            match = re.search(pattern, title, re.IGNORECASE)
            if match:
                try:
                    return float(match.group(1))
                except ValueError:
                    continue
        
        return None
    
    def _create_description(self, event_data: Dict[str, Any]) -> Optional[str]:
        """Create a description from available event data."""
        description_parts = []
        
        # Add organizer information
        organizer = event_data.get('organizer', {})
        if organizer.get('name'):
            description_parts.append(f"Organized by: {organizer['name']}")
        
        # Add participation type
        participation_type = event_data.get('participation_type', '')
        if participation_type:
            description_parts.append(f"Participation: {participation_type.title()}")
        
        # Add categories
        categories = event_data.get('network_categories', [])
        if categories:
            category_names = [cat.get('name', '').strip() for cat in categories if cat.get('name')]
            if category_names:
                description_parts.append(f"Categories: {', '.join(category_names)}")
        
        # Add webinar URL if available
        webinar_url = event_data.get('webinar_url', '')
        if webinar_url and event_data.get('show_webinar_url', False):
            description_parts.append(f"Webinar URL: {webinar_url}")
        
        return '\n'.join(description_parts) if description_parts else None
    


def main():
    """Main function to run the scraper."""
    scraper = ChIPsNetworkScraper()
    events = scraper.get_events()
    print(json.dumps([event.to_dict() for event in events], indent=2))
    
    # Print some sample events
    for i, event in enumerate(events[:3]):
        print(f"\nEvent {i+1}:")
        print(f"  Name: {event.name}")
        print(f"  Date: {event.startDate}")
        print(f"  Type: {event.event_type}")
        print(f"  Categories: {event.category}")
        if event.cle_credits:
            print(f"  CLE Credits: {event.cle_credits}")

if __name__ == "__main__":
    main() 