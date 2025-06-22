import requests
from bs4 import BeautifulSoup
from datetime import datetime
from typing import List, Optional
from base_scraper import BaseScraper
from models import Event
import logging
import re
from urllib.parse import urljoin
from categorization_helper import EventCategorizer

logger = logging.getLogger(__name__)

class NAWLScraper(BaseScraper):
    """Scraper for National Association of Women Lawyers events."""
    def __init__(self):
        super().__init__("com_nawl")
        self.base_url = "https://nawl.app.neoncrm.com"
        self.calendar_url = f"{self.base_url}/np/clients/nawl/publicaccess/eventCalendarBig.jsp"

    def clean_html(self, html_content: str) -> str:
        """Clean HTML content and extract plain text."""
        if not html_content:
            return ""
        
        # Parse HTML and extract text
        soup = BeautifulSoup(html_content, 'html.parser')
        return soup.get_text(separator=' ', strip=True)

    def get_event_details(self, event_url: str) -> dict:
        """Fetch detailed information for a specific event."""
        try:
            response = self.session.get(event_url)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract event details from the page
            details = {}
            
            # Look for common event detail patterns
            # This will need to be customized based on the actual page structure
            title_elem = soup.find('h1') or soup.find('title')
            if title_elem:
                details['title'] = title_elem.get_text(strip=True)
            
            # Look for description
            desc_elem = soup.find('div', class_='description') or soup.find('p')
            if desc_elem:
                details['description'] = desc_elem.get_text(strip=True)
            
            # Look for date/time information
            date_elem = soup.find('span', class_='date') or soup.find('div', class_='datetime')
            if date_elem:
                details['datetime'] = date_elem.get_text(strip=True)
            
            # Look for location
            location_elem = soup.find('span', class_='location') or soup.find('div', class_='venue')
            if location_elem:
                details['location'] = location_elem.get_text(strip=True)
            
            return details
            
        except Exception as e:
            logger.warning(f"Failed to fetch event details from {event_url}: {e}")
            return {}

    def determine_event_type(self, name: str, description: str) -> str:
        """Determine the event type based on name and description."""
        text_to_check = f"{name} {description}".lower()
        
        if 'cle' in text_to_check or 'continuing legal education' in text_to_check:
            return 'CLE'
        elif 'conference' in text_to_check:
            return 'Conference'
        elif 'webinar' in text_to_check:
            return 'Webinar'
        elif 'networking' in text_to_check:
            return 'Networking'
        elif 'lunch' in text_to_check:
            return 'Lunch'
        elif 'dinner' in text_to_check or 'gala' in text_to_check:
            return 'Dinner/Gala'
        elif 'workshop' in text_to_check:
            return 'Workshop'
        elif 'seminar' in text_to_check:
            return 'Seminar'
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
        processed_events = set()  # Track processed events to avoid duplicates
        
        try:
            # Get current month and the next two months
            today = datetime.now()
            months = [(today.year, today.month)]
            # Add next two months
            for i in range(1, 3):
                next_month = today.month + i
                next_year = today.year
                if next_month > 12:
                    next_month -= 12
                    next_year += 1
                months.append((next_year, next_month))
            
            for year, month in months:
                params = {
                    'year': year,
                    'month': month
                }
                response = self.session.get(self.calendar_url, params=params)
                response.raise_for_status()
                soup = BeautifulSoup(response.content, 'html.parser')
                calendar_table = soup.find('table', class_='necTableBig')
                if not calendar_table:
                    logger.error(f"Could not find calendar table for {year}-{month:02d}")
                    continue
                event_links = calendar_table.find_all('a', href=re.compile(r'event\.jsp\?event=\d+'))
                logger.info(f"Found {len(event_links)} event links in calendar for {year}-{month:02d}")
                for link in event_links:
                    try:
                        event_url = urljoin(self.base_url, link.get('href'))
                        event_name = link.get_text(strip=True)
                        if not event_name or event_url in processed_events:
                            continue
                        processed_events.add(event_url)
                        event_details = self.get_event_details(event_url)
                        parent_cell = link.find_parent('td')
                        date_text = ""
                        if parent_cell:
                            date_link = parent_cell.find('a', href=re.compile(r'eventList\.jsp'))
                            if date_link:
                                date_text = date_link.get_text(strip=True)
                        if date_text and date_text.isdigit():
                            day = int(date_text)
                            try:
                                event_date = datetime(year, month, day)
                                start_date = event_date.isoformat()
                            except ValueError:
                                start_date = f"{year}-{month:02d}-{day:02d}"
                        else:
                            start_date = f"{year}-{month:02d}-01"
                        event_type = self.determine_event_type(event_name, event_details.get('description', ''))
                        cle_credits = self.extract_cle_credits(event_name, event_details.get('description', ''))
                        event_id = event_url.split('event=')[-1] if 'event=' in event_url else event_name.lower().replace(' ', '-')
                        # Use centralized categorization
                        base_categories = ['Women in Law', 'Bar Association', 'Legal Events']
                        categories = EventCategorizer.categorize_event(
                             event_details.get('title', ''), 
                             event_details.get('description', ''), 
                             base_categories
                         )
                        
                        event = Event(
                            id=event_id,
                            name=event_name,
                            description=event_details.get('description', ''),
                            startDate=start_date,
                            endDate=None,
                            metadata={
                                'source': 'nawl_calendar',
                                'event_url': event_url,
                                'location': event_details.get('location', ''),
                                'datetime': event_details.get('datetime', ''),
                                'note': 'Events may be image-based, detail extraction limited'
                            },
                            category=categories,
                            event_type=event_type,
                            cle_credits=cle_credits
                        )
                        events.append(event)
                        logger.debug(f"Processed event: {event_name}")
                    except Exception as e:
                        logger.error(f"Error processing event link: {e}")
                        continue
        except Exception as e:
            logger.error(f"Error fetching events from NAWL calendar: {e}")
        return events



if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    scraper = NAWLScraper()
    events = scraper.run()
    print(f"Scraped {len(events)} events from NAWL")
    print(f"Events saved to scrapers/data/") 