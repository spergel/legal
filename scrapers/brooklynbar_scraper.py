import logging
import re
from datetime import datetime
from typing import List, Optional

from bs4 import BeautifulSoup

from .base_scraper import BaseScraper
from .models import Event
from .categorization_helper import EventCategorizer
import json

logger = logging.getLogger(__name__)

class BrooklynBarScraper(BaseScraper):
    """Scraper for Brooklyn Bar Association events."""
    def __init__(self, community_id="com_brooklyn_bar"):
        super().__init__(community_id)
        self.base_url = "https://www.brooklynbar.org"
        self.events_url = f"{self.base_url}/?pg=events&evAction=listAll"
        self.url = self.events_url

    def get_event_details(self, event_id: str) -> dict:
        """Fetch detailed information for a specific event."""
        detail_url = f"{self.base_url}/?pg=events&evAction=showDetail&eid={event_id}&evSubAction=listAll"
        try:
            response = self.session.get(detail_url)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            details = {}
            
            # Extract full description
            description_parts = []
            content_divs = soup.find_all('div')
            for div in content_divs:
                text = div.get_text(strip=True)
                if text and len(text) > 50:  # Look for substantial content
                    description_parts.append(text)
            
            if description_parts:
                details['full_description'] = ' '.join(description_parts[:3])  # Take first 3 substantial parts
            
            # Extract CLE credits
            cle_match = re.search(r'(\d+(?:\.\d+)?)\s+CLE\s+CREDITS?', soup.get_text(), re.IGNORECASE)
            if cle_match:
                details['cle_credits'] = float(cle_match.group(1))
            
            # Extract location information
            location_text = soup.get_text()
            if 'Brooklyn Bar Association' in location_text:
                details['location'] = 'Brooklyn Bar Association, 123 Remsen Street, Brooklyn, NY 11201'
            elif '123 Remsen Street' in location_text:
                details['location'] = 'Brooklyn Bar Association, 123 Remsen Street, Brooklyn, NY 11201'
            elif 'BBA Building' in location_text:
                details['location'] = 'BBA Building, 123 Remsen Street, Brooklyn, NY 11201'
            
            # Extract registration status
            if 'registration for this event is closed' in soup.get_text().lower():
                details['registration_status'] = 'closed'
            elif 'register' in soup.get_text().lower():
                details['registration_status'] = 'open'
            
            # Extract location
            location_match = re.search(r'at\s+([^,\n]+)', soup.get_text())
            if location_match:
                details['location'] = location_match.group(1).strip()
            
            # Extract pricing info
            if 'students free' in soup.get_text().lower():
                details['student_pricing'] = 'free'
            
            return details
            
        except Exception as e:
            logger.warning(f"Error fetching details for event {event_id}: {e}")
            return {}

    def determine_event_type(self, name: str, category: List[str], description: str) -> str:
        """Determine the event type based on name, category, and description."""
        text_to_check = f"{name} {' '.join(category or [])} {description or ''}".lower()
        
        # Check for specific event types first
        if 'annual dinner' in text_to_check:
            return 'Annual Dinner'
        elif 'pride celebration' in text_to_check:
            return 'Celebration'
        elif 'cyclones outing' in text_to_check or 'outing' in text_to_check:
            return 'Social'
        elif 'coat drive' in text_to_check:
            return 'Charity'
        elif 'salsa evening' in text_to_check:
            return 'Social'
        elif 'cocktails' in text_to_check:
            return 'Networking'
        elif 'cle' in text_to_check:
            return 'CLE'
        elif 'networking' in text_to_check:
            return 'Networking'
        else:
            return 'Event'

    def get_events(self) -> List[Event]:
        events = []
        try:
            response = self.session.get(self.events_url)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            logger.info(f"Page title: {soup.title.string if soup.title else 'No title found'}")
            event_divs = soup.find_all('div', class_='span12 clearfix well well-small')
            logger.info(f"Found {len(event_divs)} event divs with 'span12 clearfix well well-small' class")
            if not event_divs:
                event_divs = soup.find_all('div', class_='catev')
                logger.info(f"Found {len(event_divs)} event divs with 'catev' class")
            if not event_divs:
                event_divs = soup.find_all('div', id=re.compile(r'^ev\d+'))
                logger.info(f"Found {len(event_divs)} event divs with event IDs")
            if not event_divs:
                event_divs = soup.find_all('div', class_=re.compile(r'.*well.*'))
                logger.info(f"Found {len(event_divs)} divs with 'well' in class")
            for i, div in enumerate(event_divs):
                try:
                    logger.info(f"Processing event div {i+1}: {div.get('id', 'no-id')}")
                    
                    # Check if this event is image-based (impossible to scrape)
                    images = div.find_all('img')
                    if images and any('event' in img.get('src', '').lower() or 'flyer' in img.get('src', '').lower() for img in images):
                        logger.warning(f"Event {i+1} appears to be image-based, skipping")
                        continue
                    
                    # Title and link: look for <a> with <strong> child (not the date block)
                    name = None
                    event_link = None
                    event_id = None
                    for a in div.find_all('a', href=True):
                        strong = a.find('strong')
                        if strong:
                            text = strong.get_text(strip=True)
                            # Heuristic: skip if text is just a number (date block)
                            if text and not re.match(r'^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\d{1,2}$', text):
                                name = text
                                event_link = a.get('href')
                                # Extract event ID from javascript:gotoEvent(ID,0)
                                id_match = re.search(r'gotoEvent\((\d+)', event_link)
                                if id_match:
                                    event_id = id_match.group(1)
                                break
                    if not name:
                        logger.warning(f"No title found for event div {i+1}")
                        continue
                    logger.info(f"Found event: {name}")
                    logger.info(f"Event ID: {event_id}")
                    
                    # Get detailed information
                    details = {}
                    if event_id:
                        logger.info(f"Fetching details for event {event_id}")
                        details = self.get_event_details(event_id)
                    
                    # Date and time
                    date_text = ""
                    date_divs = div.find_all('div')
                    for d in date_divs:
                        text = d.get_text(strip=True)
                        if text and re.search(r'\d{1,2}/\d{1,2}/\d{4}', text):
                            date_text = text
                            break
                    logger.info(f"Date text found: {date_text}")
                    startDate = None
                    endDate = None
                    try:
                        date_pattern = r'(\d{1,2}/\d{1,2}/\d{4})(?:\s*(\d{1,2}:\d{2}\s*[AP]M))?'
                        m = re.search(date_pattern, date_text)
                        if m:
                            date_part = m.group(1)
                            time_part = m.group(2)
                            if time_part:
                                dt = datetime.strptime(f"{date_part} {time_part}", "%m/%d/%Y %I:%M %p")
                                startDate = dt.isoformat()
                            else:
                                dt = datetime.strptime(date_part, "%m/%d/%Y")
                                startDate = dt.isoformat()
                            logger.info(f"Parsed start date: {startDate}")
                        end_pattern = r'-\s*(\d{1,2}:\d{2}\s*[AP]M)'
                        m2 = re.search(end_pattern, date_text)
                        if m2 and startDate:
                            end_time = m2.group(1)
                            dt_end = datetime.strptime(f"{date_part} {end_time}", "%m/%d/%Y %I:%M %p")
                            endDate = dt_end.isoformat()
                            logger.info(f"Parsed end date: {endDate}")
                    except Exception as e:
                        logger.warning(f"Could not parse date for event '{name}': {e}")
                    
                    desc_elem = div.find('b')
                    description = desc_elem.get_text(strip=True) if desc_elem else None
                    
                    # Use detailed description if available
                    if details.get('full_description'):
                        description = details['full_description']
                    
                    cat_elem = div.find('em')
                    category = [cat_elem.get_text(strip=True)] if cat_elem else None
                    
                    # Determine event type
                    event_type = self.determine_event_type(name, category, description)
                    
                    # Get CLE credits
                    cle_credits = details.get('cle_credits')
                    
                    event_id_final = div.get('id', f"brooklynbar_{hash(name)}")
                    
                    # Build metadata with event link and details
                    metadata = {
                        "source_url": self.events_url,
                        "event_link": event_link,
                        "detail_url": f"{self.base_url}/?pg=events&evAction=showDetail&eid={event_id}&evSubAction=listAll" if event_id else None,
                        "registration_status": details.get('registration_status'),
                        "location": details.get('location'),
                        "student_pricing": details.get('student_pricing')
                    }
                    
                    # Use centralized categorization
                    base_categories = ['Bar Association', 'Legal Events']
                    if category:
                        base_categories.extend(category)
                    categories = EventCategorizer.categorize_event(name, description, base_categories)
                    
                    # Skip events without valid dates
                    if not startDate:
                        logger.warning(f"Skipping Brooklyn Bar event '{name}' - no valid date found")
                        continue
                    
                    event = Event(
                        id=event_id_final,
                        name=name,
                        description=description,
                        startDate=startDate,
                        endDate=endDate,
                        locationId=None,
                        locationName=details.get('location', 'TBD'),
                        communityId="com_brooklynbar",
                        image=None,
                        price=None,
                        metadata=metadata,
                        category=categories,
                        tags=None,
                        event_type=event_type,
                        cle_credits=cle_credits
                    )
                    events.append(event)
                    logger.info(f"Successfully created event: {name} (Type: {event_type}, CLE: {cle_credits})")
                except Exception as e:
                    logger.error(f"Error parsing Brooklyn Bar event {i+1}: {e}")
                    continue
            logger.info(f"Scraped {len(events)} events from Brooklyn Bar Association")
        except Exception as e:
            logger.error(f"Error fetching Brooklyn Bar events: {e}")
        return events

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    scraper = BrooklynBarScraper()
    events = scraper.get_events()
    print(json.dumps([event.to_dict() for event in events], indent=2)) 