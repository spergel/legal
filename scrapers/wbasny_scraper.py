import requests
import json
import re
from datetime import datetime
from typing import List, Optional
from base_scraper import BaseScraper
from models import Event
import logging
from bs4 import BeautifulSoup
from categorization_helper import EventCategorizer

logger = logging.getLogger(__name__)

class WBASNYScraper(BaseScraper):
    """Scraper for Women's Bar Association of the State of New York events via The Events Calendar API."""
    def __init__(self):
        super().__init__("com_wbasny")
        self.api_url = "https://www.wbasny.org/wp-json/tribe/views/v2/html"
        self.base_url = "https://www.wbasny.org"

    def clean_html(self, html_content: str) -> str:
        """Clean HTML content and extract plain text."""
        if not html_content:
            return ""
        
        # Parse HTML and extract text
        soup = BeautifulSoup(html_content, 'html.parser')
        return soup.get_text(separator=' ', strip=True)

    def extract_json_ld_events(self, html_content: str) -> List[dict]:
        """Extract JSON-LD event data from HTML content."""
        events = []
        
        # Find all script tags with application/ld+json
        script_pattern = r'<script type="application/ld\+json">(.*?)</script>'
        script_matches = re.findall(script_pattern, html_content, re.DOTALL)
        
        for script_content in script_matches:
            try:
                # Parse the JSON-LD content
                json_data = json.loads(script_content.strip())
                
                # Handle both single event and array of events
                if isinstance(json_data, list):
                    events.extend(json_data)
                else:
                    events.append(json_data)
                    
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse JSON-LD: {e}")
                continue
        
        return events

    def determine_event_type(self, name: str, description: str) -> str:
        """Determine the event type based on name and description."""
        text_to_check = f"{name} {description}".lower()
        
        if 'cle' in text_to_check or 'continuing legal education' in text_to_check:
            return 'CLE'
        elif 'dinner' in text_to_check or 'gala' in text_to_check:
            return 'Dinner/Gala'
        elif 'breakfast' in text_to_check:
            return 'Breakfast'
        elif 'lunch' in text_to_check:
            return 'Lunch'
        elif 'mixer' in text_to_check or 'networking' in text_to_check:
            return 'Networking'
        elif 'mentoring' in text_to_check:
            return 'Mentoring'
        elif 'installation' in text_to_check:
            return 'Installation'
        elif 'clinic' in text_to_check:
            return 'Clinic'
        elif 'pride' in text_to_check:
            return 'Pride Event'
        elif 'committee' in text_to_check or 'meeting' in text_to_check:
            return 'Committee Meeting'
        else:
            return 'Event'

    def extract_cle_credits(self, name: str, description: str) -> Optional[float]:
        """Extract CLE credits from event name or description."""
        text_to_check = f"{name} {description}".lower()
        
        # Look for CLE credit patterns
        cle_patterns = [
            r'(\d+(?:\.\d+)?)\s*cle\s*credit',
            r'(\d+(?:\.\d+)?)\s*credit',
            r'(\d+(?:\.\d+)?)\s*hour',
            r'(\d+(?:\.\d+)?)\s*ceu'
        ]
        
        for pattern in cle_patterns:
            match = re.search(pattern, text_to_check)
            if match:
                try:
                    return float(match.group(1))
                except ValueError:
                    continue
        
        return None

    def get_events(self) -> List[Event]:
        events = []
        try:
            # Prepare request parameters for current month
            current_date = datetime.now()
            month_year = current_date.strftime("%Y-%m")
            
            params = {
                'u': '/events/',
                'pu': f'/events/month/{month_year}/',
                'smu': 'true',
                'tvn1': '66b6d9a50b',
                'tvn2': ''
            }
            
            headers = {
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Priority': 'u=3, i',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15',
                'X-Requested-With': 'XMLHttpRequest'
            }
            
            response = self.session.get(self.api_url, params=params, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            html_content = data.get('html', '')
            
            # Extract JSON-LD events from HTML
            json_ld_events = self.extract_json_ld_events(html_content)
            
            logger.info(f"Found {len(json_ld_events)} events in JSON-LD data")
            
            for event_data in json_ld_events:
                try:
                    # Skip if not an event
                    if event_data.get('@type') != 'Event':
                        continue
                    
                    # Extract basic event information
                    name = event_data.get('name', '')
                    description_html = event_data.get('description', '')
                    description = self.clean_html(description_html)
                    event_url = event_data.get('url', '')
                    
                    # Extract dates
                    start_date = event_data.get('startDate', '')
                    end_date = event_data.get('endDate', '')
                    
                    # Extract organizer information
                    organizer = event_data.get('organizer', {})
                    organizer_name = organizer.get('name', '') if isinstance(organizer, dict) else str(organizer)
                    organizer_url = organizer.get('url', '') if isinstance(organizer, dict) else ''
                    
                    # Determine event type
                    event_type = self.determine_event_type(name, description)
                    
                    # Extract CLE credits
                    cle_credits = self.extract_cle_credits(name, description)
                    
                    # Generate event ID from URL or name
                    event_id = event_url.split('/')[-2] if event_url else name.lower().replace(' ', '-')
                    
                    # Use centralized categorization
                    base_categories = ['Women in Law', 'Bar Association', 'Legal Events']
                    categories = EventCategorizer.categorize_event(name, description, base_categories)
                    
                    # Create Event object
                    event = Event(
                        id=event_id,
                        name=name,
                        description=description,
                        startDate=start_date,
                        endDate=end_date,
                        metadata={
                            'source': 'wbasny_events_calendar',
                            'event_url': event_url,
                            'organizer_name': organizer_name,
                            'organizer_url': organizer_url,
                            'event_status': event_data.get('eventStatus', ''),
                            'attendance_mode': event_data.get('eventAttendanceMode', ''),
                            'performer': event_data.get('performer', '')
                        },
                        category=categories,
                        event_type=event_type,
                        cle_credits=cle_credits
                    )
                    
                    events.append(event)
                    logger.debug(f"Processed event: {name}")
                    
                except Exception as e:
                    logger.error(f"Error processing event {event_data.get('name', 'unknown')}: {e}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error fetching events from WBASNY API: {e}")
            
        return events



if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    scraper = WBASNYScraper()
    events = scraper.run()
    print(f"Scraped {len(events)} events from WBASNY")
    print(f"Events saved to scrapers/data/") 