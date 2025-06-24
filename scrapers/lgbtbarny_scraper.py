import requests
import json
from datetime import datetime
from typing import List, Optional
from .base_scraper import BaseScraper
from .models import Event
import logging
import re
from bs4 import BeautifulSoup
from .categorization_helper import EventCategorizer

logger = logging.getLogger(__name__)

class LgbtBarNyScraper(BaseScraper):
    """Scraper for LGBT Bar Association of Greater New York events via Elfsight API."""
    def __init__(self, community_id="com_lgbt_bar_ny"):
        super().__init__(community_id)
        self.api_url = "https://core.service.elfsight.com/p/boot/"
        self.widget_id = "6ffa7426-290d-46ec-8cea-f9a0d386b5c8"
        self.page_url = "https://www.lgbtbarny.org/upcoming-events"

    def clean_html(self, html_content: str) -> str:
        """Clean HTML content and extract plain text."""
        if not html_content:
            return ""
        
        # Parse HTML and extract text
        soup = BeautifulSoup(html_content, 'html.parser')
        return soup.get_text(separator=' ', strip=True)

    def parse_datetime(self, date_str: str, time_str: str, timezone: str = "America/New_York") -> str:
        """Parse date and time strings into ISO format."""
        try:
            if time_str:
                # Combine date and time
                datetime_str = f"{date_str} {time_str}"
                dt = datetime.strptime(datetime_str, "%Y-%m-%d %H:%M")
            else:
                # Date only (all day event)
                dt = datetime.strptime(date_str, "%Y-%m-%d")
            
            return dt.isoformat()
        except Exception as e:
            logger.warning(f"Failed to parse datetime {date_str} {time_str}: {e}")
            return date_str

    def determine_event_type(self, name: str, description: str) -> str:
        """Determine the event type based on name and description."""
        text_to_check = f"{name} {description}".lower()
        
        if 'pride' in text_to_check:
            return 'Pride Event'
        elif 'mixer' in text_to_check or 'networking' in text_to_check:
            return 'Networking'
        elif 'cle' in text_to_check or 'continuing legal education' in text_to_check:
            return 'CLE'
        elif 'parade' in text_to_check or 'march' in text_to_check:
            return 'Parade/March'
        elif 'dinner' in text_to_check or 'gala' in text_to_check:
            return 'Dinner/Gala'
        else:
            return 'Event'

    def get_events(self) -> List[Event]:
        events = []
        try:
            # Prepare request parameters
            params = {
                'page': f"{self.page_url}#calendar-{self.widget_id}-event-m7p9kxx2",
                'w': self.widget_id
            }
            
            headers = {
                'Accept': '*/*',
                'Sec-Fetch-Site': 'cross-site',
                'Origin': 'https://www.lgbtbarny.org',
                'Sec-Fetch-Dest': 'empty',
                'Accept-Language': 'en-US,en;q=0.9',
                'Sec-Fetch-Mode': 'cors',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': 'https://www.lgbtbarny.org/',
                'Priority': 'u=3, i'
            }
            
            response = self.session.get(self.api_url, params=params, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            
            # Extract events from the response
            if (data.get('status') == 1 and 
                'data' in data and 
                'widgets' in data['data'] and
                self.widget_id in data['data']['widgets']):
                
                widget_data = data['data']['widgets'][self.widget_id]
                if widget_data.get('status') == 1 and 'data' in widget_data:
                    events_data = widget_data['data'].get('settings', {}).get('events', [])
                    
                    logger.info(f"Found {len(events_data)} events in API response")
                    
                    for event_data in events_data:
                        try:
                            # Extract basic event information
                            event_id = event_data.get('id', '')
                            name = event_data.get('name', '')
                            description_html = event_data.get('description', '')
                            description = self.clean_html(description_html)
                            
                            # Parse dates
                            start_data = event_data.get('start', {})
                            end_data = event_data.get('end', {})
                            
                            start_date = start_data.get('date', '')
                            start_time = start_data.get('time', '')
                            end_date = end_data.get('date', '')
                            end_time = end_data.get('time', '')
                            
                            start_datetime = self.parse_datetime(start_date, start_time)
                            end_datetime = self.parse_datetime(end_date, end_time) if end_date else None
                            
                            # Extract image
                            image_data = event_data.get('image', {})
                            image_url = image_data.get('url') if image_data else None
                            
                            # Extract button/link information
                            button_data = event_data.get('buttonLink', {})
                            event_url = button_data.get('value') if button_data else None
                            
                            # Determine event type
                            event_type = self.determine_event_type(name, description)
                            
                            # Extract tags
                            tags_data = event_data.get('tags', [])
                            tags = [tag.get('tagName', '') for tag in tags_data if tag.get('tagName')]
                            
                            # Use centralized categorization
                            base_categories = ['LGBTQ+', 'Bar Association', 'Legal Events']
                            categories = EventCategorizer.categorize_event(name, description, base_categories)
                            
                            # Create Event object
                            event = Event(
                                id=event_id,
                                name=name,
                                description=description,
                                startDate=start_datetime,
                                endDate=end_datetime,
                                image=image_url,
                                metadata={
                                    'source': 'lgbtbarny_elfsight',
                                    'button_text': event_data.get('buttonText', ''),
                                    'event_url': event_url,
                                    'timezone': event_data.get('timeZone', 'America/New_York'),
                                    'is_all_day': event_data.get('isAllDay', False),
                                    'color': event_data.get('color', ''),
                                    'tags': tags
                                },
                                category=categories,
                                tags=tags,
                                event_type=event_type
                            )
                            
                            events.append(event)
                            logger.debug(f"Processed event: {name}")
                            
                        except Exception as e:
                            logger.error(f"Error processing event {event_data.get('id', 'unknown')}: {e}")
                            continue
                            
            else:
                logger.error("Invalid API response structure")
                
        except Exception as e:
            logger.error(f"Error fetching events from Elfsight API: {e}")
            
        return events



if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    scraper = LgbtBarNyScraper()
    events = scraper.run()
    print(f"Scraped {len(events)} events from LGBT Bar NY")
    print(f"Events saved to scrapers/data/") 