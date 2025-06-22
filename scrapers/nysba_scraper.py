import requests
import json
from datetime import datetime
from typing import List, Dict, Any
from base_scraper import BaseScraper
from models import Event
import logging

logger = logging.getLogger(__name__)

class NYSBAScraper(BaseScraper):
    """Scraper for New York State Bar Association events using their JSON API"""
    
    def __init__(self):
        super().__init__("com_nysba")
        self.name = "NYSBA"
        self.base_url = "https://nysba.org"
        self.api_url = "https://nysba.org/wp-json/events/v1/filter/1"
        
    def get_events(self) -> List[Event]:
        """Get events from NYSBA's JSON API"""
        events = []
        try:
            params = {
                'date': '{}',
                'searchText': ''
            }
            response = self.session.get(self.api_url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            if 'posts' not in data:
                logger.warning("No 'posts' key found in API response")
                return events
            for event_data in data['posts']:
                try:
                    event = self._parse_event(event_data)
                    if event:
                        events.append(event)
                except Exception as e:
                    logger.error(f"Error parsing event {event_data.get('id', 'unknown')}: {e}")
                    continue
            logger.info(f"Successfully scraped {len(events)} events from NYSBA")
        except requests.RequestException as e:
            logger.error(f"Request error scraping NYSBA: {e}")
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error scraping NYSBA: {e}")
        except Exception as e:
            logger.error(f"Unexpected error scraping NYSBA: {e}")
        return events
    
    def _parse_event(self, event_data: Dict[str, Any]) -> Event:
        try:
            event_id = str(event_data.get('id', ''))
            name = event_data.get('title', '').strip()
            description = event_data.get('excerpt', '').strip()
            permalink = event_data.get('permalink', '')
            date_str = event_data.get('date', '')
            startDate = None
            if date_str:
                try:
                    event_date = datetime.strptime(date_str, '%m/%d/%Y')
                    startDate = event_date.isoformat()
                except ValueError:
                    logger.warning(f"Could not parse date '{date_str}' for event {event_id}")
            image_url = None
            if 'image' in event_data and event_data['image']:
                image_url = event_data['image'].get('src', '')
            member_price = event_data.get('memberPrice', '')
            credits = event_data.get('credits', {})
            cle_credits = 0.0
            if 'totalCredits' in credits and credits['totalCredits']:
                try:
                    cle_credits = float(credits['totalCredits'].get('val', 0))
                except (ValueError, TypeError):
                    cle_credits = 0.0
            event_types = [et.get('termName', '') for et in event_data.get('eventTypes', []) if et.get('termName')]
            event_format = [ef.get('termName', '') for ef in event_data.get('eventFormat', []) if ef.get('termName')]
            practice_areas = [pa.get('termName', '') for pa in event_data.get('practiceArea', []) if pa.get('termName')]
            event_type = "CLE" if any("CLE" in et for et in event_types) else "Event"
            # Compose metadata
            metadata = {
                'permalink': permalink,
                'cle_credits': cle_credits,
                'event_types': event_types,
                'event_format': event_format,
                'practice_areas': practice_areas,
                'source': self.name
            }
            event = Event(
                id=f"nysba_{event_id}",
                name=name,
                description=description,
                startDate=startDate or "",
                endDate=None,
                locationId=None,
                communityId="com_nysba",
                image=image_url,
                price={"member": member_price} if member_price else None,
                metadata=metadata,
                category=[event_type],
                tags=event_types + event_format + practice_areas
            )
            return event
        except Exception as e:
            logger.error(f"Error parsing event data: {e}")
            return None

if __name__ == "__main__":
    scraper = NYSBAScraper()
    events = scraper.run()
    print(f"Scraped {len(events)} events from NYSBA")
    print(f"Events saved to scrapers/data/") 