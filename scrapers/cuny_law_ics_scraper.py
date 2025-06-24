#!/usr/bin/env python3
"""
CUNY School of Law ICS Calendar Scraper

This scraper fetches events from CUNY School of Law's ICS export URL:
https://www.law.cuny.edu/events/list/?ical=1

The scraper uses the ics library to parse the calendar data and extract event information.
"""

import logging
import requests
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from ics import Calendar, Event as ICSEvent
from .base_scraper import BaseScraper
from .models import Event
import hashlib
import re
from .categorization_helper import EventCategorizer
from .calendar_configs import ICS_CALENDARS
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CUNYLawICSScraper(BaseScraper):
    """Scraper for CUNY School of Law events from ICS feed."""
    
    def __init__(self, community_id="com_cuny_law"):
        super().__init__()
        self.community_id = community_id
        # Use the URL from the centralized config
        self.url = ICS_CALENDARS["cuny_law"]["id"]
        
    def get_events(self) -> List[Event]:
        """Fetch and parse events from CUNY School of Law ICS feed."""
        logger.info(f"Fetching events from CUNY School of Law ICS feed: {self.url}")
        
        try:
            # Fetch the ICS data
            response = self.session.get(self.url, timeout=30)
            response.raise_for_status()
            
            # Parse the ICS data
            calendar = Calendar(response.text)
            logger.info(f"Successfully parsed ICS calendar with {len(calendar.events)} events")
            
            events = []
            for ics_event in calendar.events:
                try:
                    event = self._parse_ics_event(ics_event)
                    if event:
                        events.append(event)
                except Exception as e:
                    logger.warning(f"Failed to parse event '{ics_event.name}': {e}")
                    continue
            
            logger.info(f"Successfully parsed {len(events)} events from CUNY School of Law")
            return events
            
        except requests.RequestException as e:
            logger.error(f"Failed to fetch ICS data: {e}")
            return []
        except Exception as e:
            logger.error(f"Failed to parse ICS calendar: {e}")
            return []
    
    def _parse_ics_event(self, ics_event: ICSEvent) -> Optional[Event]:
        """Parse an individual ICS event into our Event model."""
        try:
            # Generate a unique ID based on event name and start time
            event_id = self._generate_event_id(ics_event.name, ics_event.begin)
            
            # Parse description and extract additional information
            description = ics_event.description if hasattr(ics_event, 'description') else None
            location = ics_event.location if hasattr(ics_event, 'location') else None
            
            # Extract CLE credits from description if available
            cle_credits = self._extract_cle_credits(description) if description else None
            
            # Determine event type based on name and description
            event_type = self._determine_event_type(ics_event.name, description)
            
            # Use centralized categorization
            base_categories = ['Law School', 'Legal Events', 'Academic']
            categories = EventCategorizer.categorize_event(ics_event.name, description, base_categories)
            
            # Create metadata
            metadata = {
                "source": "CUNY School of Law",
                "ics_url": self.url,
                "location": location,
                "organizer": "CUNY School of Law",
                "raw_ics_event": {
                    "uid": getattr(ics_event, 'uid', None),
                    "url": getattr(ics_event, 'url', None),
                    "status": getattr(ics_event, 'status', None),
                    "created": str(getattr(ics_event, 'created', None)) if hasattr(ics_event, 'created') else None,
                    "last_modified": str(getattr(ics_event, 'last_modified', None)) if hasattr(ics_event, 'last_modified') else None,
                }
            }
            
            # Create the Event object
            event = Event(
                id=event_id,
                name=ics_event.name,
                description=description,
                startDate=ics_event.begin.isoformat(),
                endDate=ics_event.end.isoformat() if ics_event.end else None,
                communityId=self.community_id,
                event_type=event_type,
                cle_credits=cle_credits,
                category=categories,
                metadata=metadata
            )
            
            return event
            
        except Exception as e:
            logger.error(f"Error parsing ICS event '{ics_event.name}': {e}")
            return None
    
    def _generate_event_id(self, name: str, start_time: datetime) -> str:
        """Generate a unique event ID based on name and start time."""
        # Create a hash from name and start time
        content = f"{name}_{start_time.isoformat()}"
        return f"cuny_{hashlib.md5(content.encode()).hexdigest()[:12]}"
    
    def _extract_cle_credits(self, description: str) -> Optional[float]:
        """Extract CLE credits from event description."""
        if not description:
            return None
        
        # Look for CLE credit patterns
        cle_patterns = [
            r'(\d+(?:\.\d+)?)\s*CLE\s*credit',
            r'(\d+(?:\.\d+)?)\s*credit',
            r'CLE:\s*(\d+(?:\.\d+)?)',
            r'(\d+(?:\.\d+)?)\s*hour',
        ]
        
        for pattern in cle_patterns:
            match = re.search(pattern, description, re.IGNORECASE)
            if match:
                try:
                    return float(match.group(1))
                except ValueError:
                    continue
        
        return None
    
    def _determine_event_type(self, name: str, description: str) -> Optional[str]:
        """Determine the type of event based on name and description."""
        text = f"{name} {description or ''}".lower()
        
        if any(word in text for word in ['cle', 'continuing legal education', 'credit']):
            return 'CLE'
        elif any(word in text for word in ['networking', 'reception', 'mixer']):
            return 'Networking'
        elif any(word in text for word in ['lecture', 'talk', 'presentation', 'speaker']):
            return 'Lecture'
        elif any(word in text for word in ['conference', 'symposium', 'summit']):
            return 'Conference'
        elif any(word in text for word in ['workshop', 'training', 'seminar']):
            return 'Workshop'
        elif any(word in text for word in ['graduation', 'commencement']):
            return 'Graduation'
        elif any(word in text for word in ['orientation', 'welcome']):
            return 'Orientation'
        else:
            return 'Event'
    
    def _extract_categories(self, name: str, description: str) -> List[str]:
        """Extract categories from event name and description."""
        categories = []
        text = f"{name} {description or ''}".lower()
        
        # Legal practice areas
        practice_areas = [
            'criminal law', 'civil rights', 'immigration', 'family law', 'corporate law',
            'environmental law', 'health law', 'tax law', 'real estate', 'intellectual property',
            'labor law', 'constitutional law', 'international law', 'bankruptcy', 'estate planning'
        ]
        
        for area in practice_areas:
            if area in text:
                categories.append(area.title())
        
        # Event types
        if any(word in text for word in ['student', 'alumni', 'faculty']):
            categories.append('Academic')
        
        if any(word in text for word in ['public', 'community', 'outreach']):
            categories.append('Public Service')
        
        if any(word in text for word in ['career', 'job', 'employment']):
            categories.append('Career Development')
        
        return categories
    


def main():
    """Main function to run the scraper."""
    scraper = CUNYLawICSScraper()
    events = scraper.get_events()
    print(json.dumps([event.to_dict() for event in events], indent=2))
    
    # Print some sample events
    for i, event in enumerate(events[:3]):
        print(f"\nEvent {i+1}:")
        print(f"  Name: {event.name}")
        print(f"  Date: {event.startDate}")
        print(f"  Type: {event.event_type}")
        if event.cle_credits:
            print(f"  CLE Credits: {event.cle_credits}")

if __name__ == "__main__":
    main() 